const folder = "ITEMS";
const mainFolder = "AVDC SYSTEM";

// Only real images - SVG is deliberately excluded even though it's an
// "image" type, since it can carry an embedded <script> and would be
// served back same-origin by the nextcloud-image proxy.
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

// The client-supplied filename is untrusted - without sanitizing it, a
// crafted name like "../../../SharedFolder/x.html" would write outside the
// intended folder on the Nextcloud share (path traversal), since this name
// is spliced directly into the upload URL.
function sanitizeUploadFilename(originalName: string): string {
  const base = originalName.split(/[/\\]/).pop() || "upload";
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, "_");
  return cleaned || "upload";
}

export const NextCloudServices = {
  uploadFile: async (prodVarId: number, image: File) => {
    try {
      if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
        return {
          success: false as const,
          message: "Unsupported image type. Use PNG, JPEG, WEBP, or GIF.",
        };
      }

      if (image.size > MAX_UPLOAD_BYTES) {
        return {
          success: false as const,
          message: "Image is too large (max 10MB).",
        };
      }

      const buffer = Buffer.from(await image.arrayBuffer());

      const safeFileName = `${Date.now()}-${sanitizeUploadFilename(image.name)}`;
      const nextCloudUrl = `${process.env.NEXT_CLOUD_URL}/${encodeURIComponent(mainFolder)}/${encodeURIComponent(folder)}/${encodeURIComponent(safeFileName)}`;
      const uploadResponse = await fetch(nextCloudUrl, {
        method: "PUT",
        body: buffer,
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.NEXT_CLOUD_USERNAME}:${process.env.NEXT_CLOUD_PASSWORD}`,
            ).toString("base64"),
          // Guaranteed to be one of ALLOWED_IMAGE_TYPES above - never
          // forwarded from the client verbatim.
          "Content-Type": image.type,
        },
      });
      if (!uploadResponse.ok) {
        throw new Error(
          `Nextcloud upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`,
        );
      }

      return {
        success: true as const,
        fileName: safeFileName,
        url: nextCloudUrl,
      };
    } catch (e) {
      return {
        success: false as const,
        message: "Failed to upload files",
        error: e,
      };
    }
  },
};
