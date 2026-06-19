import { getDBConnection } from "@/lib/db";
import { getIntegrationByFields } from "../get-integration";
import { createIntegration } from "../create-integration";
import { createLoyverseIntegration } from "./create-loyverse-integration";
import { getExpiresAt } from "@/utils/utils";

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: string;
  scope: string;
  token_type: string;
}
// tokenData.access_token
// tokenData.refresh_token
// tokenData.expires_in
// tokenData.scope

export async function processCreateNewLoyverseIntegration({
  storeId,
  tokenData,
  userId,
}: {
  storeId: number;
  tokenData: TokenData;
  userId: number;
}) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    if (!storeId) {
      throw new Error("No store ID found!");
    }
    if (!userId) {
      throw new Error("No user ID found");
    }

    if (!tokenData) {
      throw new Error("No token data found!");
    }

    //check first if there is already a integration
    const integration = await getIntegrationByFields({
      connection,
      keyFields: { storeId: storeId, integrationType: "loyverse" },
    });

    const isExisting = integration.length > 0;

    if (isExisting) {
      //update the loyser
    } else {
      //create new
      const integid = await createIntegration({
        connection: connection,
        data: {
          storeId: storeId,
          integrationType: "loyverse",
        },
      });

      await createLoyverseIntegration({
        connection: connection,
        data: {
          integId: integid,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          createdBy: userId,
          scope: tokenData.scope,
          tokenType: tokenData.token_type,
          expiresAt: getExpiresAt(tokenData.expires_in),
        },
      });
    }

    //if not exist, insert new integration and new loyverse integration
    //if existing, upsert it
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
