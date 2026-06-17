interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: string;
  scope: string;
}
// tokenData.access_token
// tokenData.refresh_token
// tokenData.expires_in
// tokenData.scope

export async function processCreateNewLoyverseIntegration({
  storeId,
  tokenData,
}: {
  storeId: number;
  tokenData: TokenData;
}) {
  try {
    console.log("Agi here!");

    //check first if there is already a integration
  } catch (e) {
    throw e;
  }
}
