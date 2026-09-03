// Reads a File/Blob into a base64 data URL (e.g. "data:image/png;base64,...").
//
// Image uploads are sent as base64 JSON rather than multipart/form-data because
// multipart bodies were being corrupted on the HTTPS origin (a stale service
// worker / proxy), producing "Failed to parse body as FormData" on the server.
// JSON requests are unaffected.
export const fileToDataUrl = (file: File | Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
