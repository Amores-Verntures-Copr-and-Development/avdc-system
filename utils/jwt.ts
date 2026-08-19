// lib/tokens.ts
import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export type RefreshTokenPayload = {
  userId: number;
};

export type AccessTokenPayload = {
  userId: number;
  userFullName: string;
  userFname: string;
  userLname: string;
  userRole: string;
  empPosition: number;
  storeId: number | null;
};

export type CustomerAccessTokenPayload = {
  cusAccId: number;
  customerId: number;
  email: string;
  storeId: number;
};

export type CustomerRefreshTokenPayload = {
  cusAccId: number;
};

type SignOptionsAndSecret = SignOptions & {
  secret: string;
};

// Fail fast on a missing secret instead of silently signing with an empty
// string, which jsonwebtoken accepts as a valid (and trivially guessable)
// HMAC key - a misconfigured deploy would otherwise forge-able tokens with
// no error at all.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const accessTokenOptions: SignOptionsAndSecret = {
  expiresIn: "30d",
  secret: requireEnv("SECRET_KEY"),
};

const refreshTokenOptions: SignOptionsAndSecret = {
  expiresIn: "30d",
  secret: requireEnv("REFRESH_SECRET_KEY"),
};

/**
 * Sign any payload with the given options.
 */
export const signToken = <
  T extends
    | AccessTokenPayload
    | RefreshTokenPayload
    | CustomerAccessTokenPayload
    | CustomerRefreshTokenPayload,
>(
  payload: T,
  options: SignOptionsAndSecret = accessTokenOptions
): string => {
  const { secret, ...signOpts } = options;
  return jwt.sign(payload, secret, signOpts);
};

/**
 * Verify a token (access or refresh) and return its payload.
 * Throws if invalid or expired.
 */
export const verifyToken = <T extends object>(
  token: string,
  options: SignOptionsAndSecret = accessTokenOptions,
  verifyOpts?: VerifyOptions
): T => {
  const { secret } = options;
  return jwt.verify(token, secret, verifyOpts) as T;
};

/**
 * Generate both an accessToken and refreshToken for a given userId.
 */
export const generateTokens = (
  userId: number,
  userFname: string,
  userLname: string,
  userRole: string,
  empPosition: number,
  storeId: number | null
) => {
  const userFullName = userLname ? `${userFname} ${userLname}` : userFname;
  const accessToken = signToken(
    {
      userId,
      userFullName,
      userFname,
      userLname,
      userRole,
      empPosition,
      storeId,
    },
    accessTokenOptions
  );
  const refreshToken = signToken({ userId, empPosition }, refreshTokenOptions);
  return { accessToken, refreshToken };
};

/**
 * Generate both an accessToken and refreshToken for a given customer account.
 */
export const generateCustomerTokens = (
  cusAccId: number,
  customerId: number,
  email: string,
  storeId: number
) => {
  const accessToken = signToken(
    { cusAccId, customerId, email, storeId },
    accessTokenOptions
  );
  const refreshToken = signToken({ cusAccId }, refreshTokenOptions);
  return { accessToken, refreshToken };
};
