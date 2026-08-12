import { NextRequest, NextResponse } from "next/server";

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

    const base = process.env.NEXT_CLOUD_IMAGE_PREVIEW || "";
    const upstreamUrl = `${base}${file}`;

    const upstreamRes = await fetch(upstreamUrl);

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: upstreamRes.status === 404 ? 404 : 502 },
      );
    }

    const contentType =
      upstreamRes.headers.get("content-type") || "application/octet-stream";
    const buffer = await upstreamRes.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 },
    );
  }
}
