export interface Products {
  prodId: number;
  prodName: string;
  prodCreatedAt: string;
  prodUpdatedAt: string;
  prodDeletedAt: string;
  storeId?: number | null;
  prodCreatedBy: number;
  prodCatId: number | null;
  productVariants?: ProductVariants[];
}

export interface ProductVariants {
  prodVarId: number;
  prodVarName: string;
  prodVarPrice: number;
  prodVarUnit?: string | null;
  isDeductInv: boolean;
  prodVarCreatedAt: string;
  prodVarUpdatedAt: string;
  prodVarDeletedAt: string;
  prodVarCreatedBy: number;
  prodId: number;
  variantComponents?: VariantComponents[];
  sold?: number;
}

export interface VariantComponents {
  varComId: number;
  quantityRequired: number;
  prodVarId: number;
  inventoryItemId: number;
  isDeductVar: boolean;
  sold?: number;
  left?: number;
}

export interface ProductPrices {
  prodPriceId: number;
  prodPriceAmount: number;
  prodPriceCreatedAt: string;
  prodPriceCreatedBy: number;
  productId: number;
}

export interface ProductCategories {
  prodCatId: number | null;
  prodCatName: string;
  prodCatCreatedAt: string;
  prodCatUpdatedAt: string;
  prodCatDeletedAt: string;
  prodCatCreatedBy: number;
  storeId?: number | null;
}
