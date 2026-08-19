import { NextRequest, NextResponse } from "next/server";

interface CachedImage {
  buffer: ArrayBuffer;
  contentType: string;
  cachedAt: number;
}

// The upstream NextCloud host serializes/queues requests under concurrent
// load (measured 15 parallel fetches ranging 1.3s up to ~20s) - a POS page
// loading dozens of product images at once pushes well past that and starts
// timing out or getting connection-reset. The same handful of product
// images get requested repeatedly across every POS session, so caching
// fetched bytes in-process (and de-duping concurrent requests for a file
// that's already mid-fetch) removes almost all of that repeat upstream
// load instead of re-fetching the same slow host every time.
const imageCache = new Map<string, CachedImage>();
const inFlight = new Map<string, Promise<CachedImage>>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Never trust the upstream Content-Type verbatim - uploads are validated
// to real image types at write time (see services/next-cloud/next-cloud.ts),
// but this proxy also serves whatever already exists on the share from
// before that validation existed, so it re-validates on the way out too.
// Anything not recognized as a safe image type is served as
// application/octet-stream, which browsers won't execute as HTML/script.
const SAFE_IMAGE_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

function sanitizeContentType(contentType: string): string {
  const base = contentType.split(";")[0].trim().toLowerCase();
  return SAFE_IMAGE_CONTENT_TYPES.has(base)
    ? base
    : "application/octet-stream";
}

async function fetchFromUpstream(file: string): Promise<CachedImage> {
  // Reuses the existing public var rather than a new server-only one -
  // it's already present wherever this app runs, so there's no separate
  // env rollout to coordinate before this works.
  const base = process.env.NEXT_PUBLIC_NEXT_CLOUD_IMAGE_PREVIEW;
  if (!base) {
    throw Object.assign(new Error("Image source not configured"), {
      status: 500,
    });
  }

  const upstreamUrl = `${base}${encodeURIComponent(file)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstreamUrl, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!upstreamRes.ok) {
    throw Object.assign(
      new Error(`Upstream returned ${upstreamRes.status}`),
      { status: upstreamRes.status },
    );
  }

  const contentType = sanitizeContentType(
    upstreamRes.headers.get("content-type") || "",
  );
  const buffer = await upstreamRes.arrayBuffer();

  return { buffer, contentType, cachedAt: Date.now() };
}

// Fetches the image from NextCloud's plain-http public share server-side
// and streams it back from our own origin. Browsers block loading a
// http:// image directly from a https:// page as mixed content - the
// request just silently fails with no image and no visible error, since
// there's nothing on the page to fetch server-side and re-serve otherwise.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const file = searchParams.get("file");

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // Reject path traversal / anything outside a plain filename.
    if (file.includes("..") || file.includes("/")) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }

    const cached = imageCache.get(file);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return new NextResponse(cached.buffer, {
        status: 200,
        headers: {
          "Content-Type": cached.contentType,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control":
            "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }

    let pending = inFlight.get(file);
    if (!pending) {
      pending = fetchFromUpstream(file).finally(() => {
        inFlight.delete(file);
      });
      inFlight.set(file, pending);
    }

    const result = await pending;
    imageCache.set(file, result);

    return new NextResponse(result.buffer, {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control":
          "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (e: any) {
    console.error("nextcloud-image proxy failed:", e);
    const isTimeout = e?.name === "AbortError";
    const status = isTimeout ? 504 : (e?.status ?? 502);

    return NextResponse.json(
      {
        error: isTimeout ? "Image request timed out" : "Failed to fetch image",
        detail: e?.message || String(e),
      },
      { status },
    );
  }
}
