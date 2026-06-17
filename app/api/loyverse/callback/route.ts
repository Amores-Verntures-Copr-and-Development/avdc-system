import { getStore } from "@/controllers/StoreControllers";
import { processCreateNewLoyverseIntegration } from "@/services/integration/loyverse/process-create-new-loyverse-integration";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  console.log("Callback URL:", req.url);

  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const state = req.nextUrl.searchParams.get("state");

  if (!state) {
    return NextResponse.json({ error: "Missing state" }, { status: 400 });
  }
  const decoded = JSON.parse(Buffer.from(state, "base64url").toString());

  const { storeId, baseUrl } = decoded;

  console.log("Store ID:", storeId);
  console.log("OAuth code exists:", !!code);
  console.log("OAuth error:", error);

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
  console.log({ tokenRes });
  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    return NextResponse.json(tokenData, { status: 400 });
  }

  console.log({ tokenData });
  // Save these encrypted in database
  // tokenData.access_token
  // tokenData.refresh_token
  // tokenData.expires_in
  // tokenData.scope

  await processCreateNewLoyverseIntegration({ storeId, tokenData: tokenData });
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
