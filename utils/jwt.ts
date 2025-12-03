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

type SignOptionsAndSecret = SignOptions & {
  secret: string;
};

const accessTokenOptions: SignOptionsAndSecret = {
  expiresIn: "30d",
  secret: process.env.SECRET_KEY || "",
};

const refreshTokenOptions: SignOptionsAndSecret = {
  expiresIn: "30d",
  secret: process.env.REFRESH_SECRET_KEY || "",
};

/**
 * Sign any payload with the given options.
 */
export const signToken = (
  payload: AccessTokenPayload | RefreshTokenPayload,
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
