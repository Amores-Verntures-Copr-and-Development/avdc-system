import { CreateBarcodeDto } from "@/dtos/barcode.dto";
import { insertBarcode, selectBarcodes } from "@/models/barcodeModels";
import { PoolConnection } from "mysql2/promise";
import { getBarcodeByFields } from "./get-barcode";
import { getProductVariants } from "../products/product-variant/get-product-variants";
import { getVariantComponents } from "../products/product-variant/variant-component/get-variant-components";
import { updateBarcodesByFields } from "./update-barcode";
import { getDBConnection } from "@/lib/db";

export async function createBarcode({
  data,
  connection,
}: {
  data: CreateBarcodeDto[];
  connection?: PoolConnection;
}) {
  let localConnection = false;
  let newConnection: any;
  if (!connection) {
    localConnection = true;
    const newPool = await getDBConnection();
    newConnection = await newPool.getConnection();
    await newConnection.beginTransaction();
  }
  try {
    // could add more logic here like checking for duplicates before inserting,

    const existingBarcodes = await getBarcodeByFields({
      connection: connection ? connection : newConnection,
      keyFields: { barcode: data.map((item) => item.barcode) },
    });

    if (existingBarcodes.length > 0) {
      const existingBarcodesStr = existingBarcodes
        .map((b) => b.barcode)
        .join(", ");
      throw new Error(
        `The following barcodes already exist: ${existingBarcodesStr}`,
      );
    }

    await insertBarcode({ data, connection });

    for (const item of data) {
      if (item.inventoryItemId) {
        //check in prodId

        const existingInProdVar = await getVariantComponents({
          keyFields: { inventoryItemId: item.inventoryItemId },
          connection: connection ? connection : newConnection,
        });

        if (existingInProdVar.length > 0) {
          await updateBarcodesByFields({
            keyFields: ["barcode"],
            updates: existingInProdVar.map((ev) => ({
              barcode: item.barcode,
              prodVarId: item.prodVarId,
            })),
            connection: connection ? connection : newConnection,
          });
          //update the barcodes to add prodVarId with the existing barcodes and ivnentoryitemId
        }
      }

      if (item.prodVarId) {
        // check in prodVarId
      }
    }

    if (localConnection) {
      await newConnection.commit();
    }
  } catch (e) {
    if (localConnection) {
      await newConnection.rollback();
    }
    throw e;
  } finally {
    if (localConnection) {
      await newConnection.release();
    }
  }
}
