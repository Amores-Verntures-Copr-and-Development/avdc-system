import { getStore } from "@/controllers/StoreControllers";
import { processCreateNewLoyverseIntegration } from "@/services/integration/loyverse/process-create-new-loyverse-integration";
import { allowedOrigins } from "@/middleware";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

interface LoyverseOAuthState {
  storeId: number;
  baseUrl: string;
  userId: number;
  purpose: string;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const state = req.nextUrl.searchParams.get("state");

  if (!state) {
    return NextResponse.json({ error: "Missing state" }, { status: 400 });
  }

  let decoded: LoyverseOAuthState;
  try {
    decoded = jwt.verify(state, process.env.SECRET_KEY!) as LoyverseOAuthState;
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired state" },
      { status: 400 },
    );
  }

  if (decoded.purpose !== "loyverse-oauth") {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const { storeId, userId } = decoded;
  // Only redirect back to an origin this app actually serves - an
  // unvalidated baseUrl would let a forged (but signed-by-us-if-leaked)
  // state redirect the browser to an attacker-controlled site.
  const baseUrl = allowedOrigins.includes(decoded.baseUrl)
    ? decoded.baseUrl
    : allowedOrigins[0];

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const body = new URLSearchParams({
    client_id: process.env.LOYVERSE_CLIENT_ID!,
    client_secret: process.env.LOYVERSE_CLIENT_SECRET!,
    redirect_uri: process.env.LOYVERSE_REDIRECT_URI!,
    code,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://api.loyverse.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    return NextResponse.json(tokenData, { status: 400 });
  }

  // Save these encrypted in database
  // tokenData.access_token
  // tokenData.refresh_token
  // tokenData.expires_in
  // tokenData.scope

  await processCreateNewLoyverseIntegration({
    storeId,
    tokenData: tokenData,
    userId,
  });
  const storedData = await getStore({ keyfields: { storeId: storeId } });
  const stores = Array.isArray(storedData.data) ? storedData.data : [];

  if (stores.length === 0) {
    return NextResponse.json(
      {
        success: true,
        message: "Loyverse connected, but store was not found.",
      },
      { status: 200 },
    );
  }

  const store = stores[0] as { storeName: string };

  return NextResponse.redirect(
    `${baseUrl}/stores/${encodeURIComponent(store.storeName)}`,
  );
}
