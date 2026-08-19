// app/api/loyverse/connect/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ storeId: string }>;
  },
) {
  let baseUrl: string = "";
  const { storeId } = await params;

  const user = getCurrentUser(req);
  if (!storeId) {
    throw new Error("No store ID found!");
  }

  const referer = req.headers.get("referer");

  if (referer) {
    const url = new URL(referer);

    baseUrl = `${url.protocol}//${url.host}`;
  }
  // Signed (not just base64-encoded) so the callback can trust storeId/
  // userId/baseUrl instead of taking them from an attacker-suppliable
  // param - an unsigned state let anyone forge a callback request that
  // binds their own Loyverse account to an arbitrary store/user.
  const state = jwt.sign(
    {
      storeId,
      baseUrl,
      userId: user.userId,
      purpose: "loyverse-oauth",
    },
    process.env.SECRET_KEY!,
    { expiresIn: "10m" },
  );

  const scopes = [
    "ITEMS_READ",
    "CUSTOMERS_READ",
    "INVENTORY_READ",
    "RECEIPTS_READ",
    "STORES_READ",
    "MERCHANT_READ",
  ].join(" ");

  const url = new URL("https://api.loyverse.com/oauth/authorize");

  url.searchParams.set("client_id", process.env.LOYVERSE_CLIENT_ID!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", process.env.LOYVERSE_REDIRECT_URI!);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
