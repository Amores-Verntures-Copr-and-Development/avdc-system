import { updateProductVariants } from "@/models/productModel";
import { ProductVariants } from "@/types/products";
import { PoolConnection } from "mysql2/promise";

export const updateProductVariantServices = {
    updateProductVariants:async ({
      connection,
      updates,
      keyFields = ["prodVarId"],
    }: // 👈 optional per-field mode
    {
      connection?: PoolConnection;
      updates: Partial<ProductVariants>[];
      keyFields?: (keyof ProductVariants)[];
    })=>{
        try{
            const result = await updateProductVariants({connection,updates,keyFields})
            return result
        }
        catch(e){
            throw e;
        }
    },
}