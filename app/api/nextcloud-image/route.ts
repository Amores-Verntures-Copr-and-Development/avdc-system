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

async function fetchFromUpstream(file: string): Promise<CachedImage> {
  const base = process.env.NEXT_CLOUD_IMAGE_PREVIEW || "";
  const upstreamUrl = `${base}${file}`;

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

  const contentType =
    upstreamRes.headers.get("content-type") || "application/octet-stream";
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

    const cached = imageCache.get(file);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return new NextResponse(cached.buffer, {
        status: 200,
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=86400",
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
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e: any) {
    console.error("nextcloud-image proxy failed:", e);
    const isTimeout = e?.name === "AbortError";
    const status = isTimeout ? 504 : e?.status === 404 ? 404 : 502;

    return NextResponse.json(
      {
        error: isTimeout ? "Image request timed out" : "Failed to fetch image",
        detail: e?.message || String(e),
      },
      { status },
    );
  }
}
