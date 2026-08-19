import jwt from "jsonwebtoken";

export interface ExternalDashboardSessionPayload {
  userId: number;
  purpose: "external-dashboard";
}

// Deliberately signed with its own secret, never SECRET_KEY (the one behind
// avdc_accessToken) - if these ever shared a secret, a leaked dashboard
// session JWT could be replayed as a real employee session cookie, since
// neither getCurrentUser() nor the middleware check a "purpose" claim.
//
// Fails fast on a missing secret instead of silently signing with an empty
// string, which jsonwebtoken accepts as a valid (and trivially guessable)
// HMAC key.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const SECRET = requireEnv("EXTERNAL_DASHBOARD_JWT_SECRET");

export const signExternalDashboardSession = (userId: number) =>
  jwt.sign({ userId, purpose: "external-dashboard" }, SECRET, {
    expiresIn: "7d",
  });

export const verifyExternalDashboardSession = (
  token: string,
): ExternalDashboardSessionPayload => {
  const payload = jwt.verify(token, SECRET) as ExternalDashboardSessionPayload;

  if (payload.purpose !== "external-dashboard") {
    throw new Error("Invalid session token");
  }

  return payload;
};
