const folder = "ITEMS";
const mainFolder = "AVDC SYSTEM";
export const NextCloudServices = {
  uploadFile: async (prodVarId: number, image: File) => {
    try {
      const buffer = Buffer.from(await image.arrayBuffer());

      const safeFileName = `${Date.now()}-${image.name.replace(/\s+/g, "-")}`;
      const nextCloudUrl = `${process.env.NEXT_CLOUD_URL}/${encodeURIComponent(mainFolder)}/${encodeURIComponent(folder)}/${safeFileName}`;
      const uploadResponse = await fetch(nextCloudUrl, {
        method: "PUT",
        body: buffer,
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.NEXT_CLOUD_USERNAME}:${process.env.NEXT_CLOUD_PASSWORD}`,
            ).toString("base64"),
          "Content-Type": image.type || "application/octet-stream",
        },
      });
      console.log({ uploadResponse });
      if (!uploadResponse.ok) {
        throw new Error(
          `Nextcloud upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`,
        );
      }

      return {
        fileName: safeFileName,
        url: nextCloudUrl,
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to upload files",
        error: e,
      };
    }
  },
};
