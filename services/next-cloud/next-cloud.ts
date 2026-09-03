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
  // A name made up of only dots (".", "..", "...") survives the character
  // class above untouched - with no "/" left to split into segments, a bare
  // ".." here is still resolved as a traversal segment by the WebDAV path.
  return cleaned && !/^\.+$/.test(cleaned) ? cleaned : "upload";
}

// Matches a name produced by sanitizeUploadFilename: safe characters only,
// and not reducible to a pure "." / ".." traversal segment.
const SAFE_STORED_FILENAME = /^(?!\.+$)[A-Za-z0-9._-]+$/;

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

  // Re-validates rather than trusting the caller (even though today every
  // caller passes a filename read back from the DB, i.e. one uploadFile
  // already sanitized) - encodeURIComponent alone doesn't stop traversal
  // segments like ".." from reaching the WebDAV path, so this is the one
  // place that must hold the line if a future caller ever passes raw input.
  deleteFile: async (fileName: string) => {
    try {
      if (!SAFE_STORED_FILENAME.test(fileName)) {
        return {
          success: false as const,
          message: "Invalid file name",
        };
      }

      const nextCloudUrl = `${process.env.NEXT_CLOUD_URL}/${encodeURIComponent(mainFolder)}/${encodeURIComponent(folder)}/${encodeURIComponent(fileName)}`;
      const deleteResponse = await fetch(nextCloudUrl, {
        method: "DELETE",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.NEXT_CLOUD_USERNAME}:${process.env.NEXT_CLOUD_PASSWORD}`,
            ).toString("base64"),
        },
      });
      // 404 just means it's already gone - nothing left to clean up.
      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        throw new Error(
          `Nextcloud delete failed: ${deleteResponse.status} ${deleteResponse.statusText}`,
        );
      }
      return { success: true as const };
    } catch (e) {
      return {
        success: false as const,
        message: "Failed to delete old file",
        error: e,
      };
    }
  },
};
