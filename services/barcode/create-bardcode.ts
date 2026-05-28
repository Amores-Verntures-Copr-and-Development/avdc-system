import { CreateBarcodeDto } from "@/dtos/barcode.dto";
import { insertBarcode, selectBarcodes } from "@/models/barcodeModels";
import { PoolConnection } from "mysql2/promise";
import { getBarcodeByFields } from "./get-barcode";
import { getProductVariants } from "../products/product-variant/get-product-variants";
import { getVariantComponents } from "../products/product-variant/variant-component/get-variant-components";
import { updateBarcodesByFields } from "./update-barcode";
import { getDBConnection } from "@/lib/db";
import { selectProductVariantsTable } from "@/models/productModel";

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

    for (const item of data) {
      const barcodeExisting = await getBarcodeByFields({
        connection: connection ? connection : newConnection,
        keyFields: {
          barcode: item.barcode,
        },
      });

      if (barcodeExisting.length === 0) {
        const barcodeId = await insertBarcode({
          data: [item],
          connection: connection ? connection : newConnection,
        });

        if (item.inventoryItemId) {
          const existingInProdVar = await selectProductVariantsTable({
            keyFields: { inventoryItemId: item.inventoryItemId },
            connection: connection ? connection : newConnection,
          });
          if (existingInProdVar.length > 0) {
            await updateBarcodesByFields({
              keyFields: ["barcodeId"],
              updates: [
                {
                  barcodeId: barcodeId,
                  prodVarId: existingInProdVar[0].prodVarId,
                },
              ],
              connection: connection ? connection : newConnection,
            });
            //update the barcodes to add prodVarId with the existing barcodes and ivnentoryitemId
          }
        }

        if (item.prodVarId) {
          const existingInProdVar = await selectProductVariantsTable({
            keyFields: { prodVarId: item.prodVarId },
            connection: connection ? connection : newConnection,
          });
          if (existingInProdVar.length > 0) {
            await updateBarcodesByFields({
              keyFields: ["barcodeId"],
              updates: [
                {
                  barcodeId: barcodeId,
                  inventoryItemId: existingInProdVar[0].inventoryItemId,
                },
              ],
              connection: connection ? connection : newConnection,
            });
          }
        }
      }

      if (barcodeExisting.length > 0) {
        for (const barcode of barcodeExisting) {
          if (item.inventoryItemId) {
            if (barcode.inventoryItemId !== null) {
              throw new Error(
                `Barcode ${barcode.barcode} already has an inventory item`,
              );
            }

            await updateBarcodesByFields({
              keyFields: ["barcodeId"],
              updates: [
                {
                  barcodeId: barcode.barcodeId,
                  inventoryItemId: item.inventoryItemId,
                },
              ],
              connection: connection ? connection : newConnection,
            });
          }
          if (item.prodVarId) {
            if (barcode.prodVarId !== null) {
              throw new Error(
                `Barcode ${barcode.barcode} already has a product variant`,
              );
            }

            await updateBarcodesByFields({
              keyFields: ["barcodeId"],
              updates: [
                {
                  barcodeId: barcode.barcodeId,
                  prodVarId: item.prodVarId,
                },
              ],
              connection: connection ? connection : newConnection,
            });
          }
        }
      }
    }

    if (localConnection) {
      await newConnection.commit();
    }
  } catch (e) {
    console.log({ e });
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
