export interface Products {
  productId: number;
  productCode: string;
  productPrice: number;
  productDescription: string;
  productCreatedAt: string;
  productUpdatedAt: string;
  productDeletedAt: string;
  productCreatedBy: number;
  inventoryItemId: number;
  inventoryId: number;
  prodCatId: number;
  productPrices?: ProductPrices[];
}

export interface ProductPrices {
  prodPriceId: number;
  prodPriceAmount: number;
  prodPriceCreatedAt: string;
  prodPriceCreatedBy: number;
  productId: number;
}

export interface ProductCategories {
  prodCatId: number;
  prodCatName: string;
  prodCatCreatedAt: string;
  prodCatUpdatedAt: string;
  prodCatDeletedAt: string;
  prodCatCreatedBy: number;
  inventoryId: number;
}
