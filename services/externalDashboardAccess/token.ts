import crypto from "crypto";

// The raw token is shown to the admin exactly once at grant/regenerate time
// and never stored - only its hash is persisted, so a DB leak alone can't
// be used to impersonate a dashboard-access grant.
export const generateRawToken = () => crypto.randomBytes(32).toString("hex");

export const hashToken = (rawToken: string) =>
  crypto.createHash("sha256").update(rawToken).digest("hex");
