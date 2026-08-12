// Routes every product image through our own /api/nextcloud-image instead
// of linking straight to NextCloud's plain-http public share - loading that
// http:// URL directly from a https:// page gets silently blocked as mixed
// content, so images just never appear with no visible error.
export const getNextCloudImageUrl = (fileName?: string | null): string =>
  fileName
    ? `/api/nextcloud-image?file=${encodeURIComponent(fileName)}`
    : "";
