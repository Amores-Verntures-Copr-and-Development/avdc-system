// lib/auth/getCurrentUser.ts

import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export interface AuthUser {
  userId: number;
  userRole: string;
  userFullName: string;
  empPosition: number;
  storeId: number | null;
}

export function getCurrentUser(req: NextRequest): AuthUser {
  const token = req.cookies.get("avdc_accessToken")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  return jwt.verify(token, process.env.SECRET_KEY!) as AuthUser;
}
