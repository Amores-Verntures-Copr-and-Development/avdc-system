"use client";

import PageHeader from "@/components/shared/PageHeader";
import React, { useEffect, useState } from "react";
import ProductCardDetails from "./components/ProductCardDetails";
import PageLayout from "@/components/shared/PageLayout";
import { Boxes, Package2, PhilippinePeso, Plus, Users } from "lucide-react";
import Table, { Column } from "@/components/shared/Table";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import AddProductModal from "./components/AddProductModal";
import useSWR from "swr";
import { useSession } from "@/hooks/useSession";
import { InventoryInterface } from "@/types/inventory";
import { fetcher } from "@/utils/fetcher";
import { DisplayProductsDtos } from "@/dtos/products.dto";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";

const columns: Column<DisplayProductsDtos>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  { key: "productCode", name: "Product Code " },
  { key: "itemName", name: "Product Name" },
  {
    key: "inventoryItemQuantity",
    name: "Stock Available",
    selector: (row) => formatQuantityByUnit(row.productPrice, row.itemUnit),
  },
  {
    key: "inventoryItemMin",
    name: "Min. Stock",
    selector: (row) => row.inventoryItemMin,
  },
  { key: "itemPrice", name: "Cost Price" },
  { key: "productPrice", name: "Selling Price" },
];

const ProductPage = () => {
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [inventoryId, setInventoryId] = useState(0);
  const { user, hasStore } = useSession();
  const inventoryBaseUrl = hasStore
    ? `/api/inventory/${user?.storeId}`
    : `/api/inventory`;
  const { data: inventoryResponse = { data: [] } } = useSWR<{
    data: InventoryInterface[];
  }>(inventoryBaseUrl, fetcher);
  useEffect(() => {
    if (
      inventoryResponse &&
      Array.isArray(inventoryResponse.data) &&
      inventoryResponse.data.length > 0
    ) {
      setInventoryId(inventoryResponse.data[0].inventoryId);
    }
  }, [inventoryResponse]);
  const { data: itemResponse = { data: [] } } = useSWR<{
    data: DisplayProductsDtos[];
  }>(inventoryId ? `/api/products/${inventoryId}` : null, fetcher);
  return (
    <PageLayout className="gap-4 p-2">
      <PageHeader title={"Products"} subtitle="Add, edit, and track products" />
      <div className="grid grid-cols-4 gap-4">
        <ProductCardDetails
          title={"Total Products"}
          value={20}
          icon={<Package2 className="w-6 h-6 text-primary-1" />}
          iconBg="bg-pink-100"
        />
        <ProductCardDetails
          title={"Total Stock"}
          value={20}
          icon={<Boxes className="w-6 h-6 text-blue-500" />}
          iconBg="bg-blue-100"
        />
        <ProductCardDetails
          title={"Total Sales"}
          value={20}
          icon={<PhilippinePeso className="w-6 h-6 text-green-500" />}
          iconBg="bg-green-100"
        />
        <ProductCardDetails
          title={"Total Customers"}
          value={20}
          icon={<Users className="w-6 h-6 text-yellow-500" />}
          iconBg="bg-yellow-100"
        />
      </div>
      <div className="flex-1 min-h-0  flex flex-col justify-between overflow-hidden">
        <Table
          columns={columns}
          data={itemResponse.data}
          totalCount={20}
          maxHeight="h-full"
          renderTopActions={
            <div className="flex gap-2">
              <div>
                <Button
                  isRounded={false}
                  className="text-sm"
                  label="Add Category"
                  size="xs"
                  icon={<Plus size={20} />}
                  onClick={() => {
                    setShowAddProductModal(true);
                  }}
                  color="secondary"
                />
              </div>
              <div>
                <Button
                  isRounded={false}
                  className="text-sm"
                  label="Add Product"
                  size="xs"
                  icon={<Plus size={20} />}
                  onClick={() => {
                    setShowAddProductModal(true);
                  }}
                />
              </div>
            </div>
          }
        />
      </div>
      <Modal
        title="Add Product"
        size="lg"
        className="min-h-[50%]"
        isOpen={showAddProductModal}
        onClose={function (): void {
          setShowAddProductModal(false);
        }}
      >
        <AddProductModal />
      </Modal>
    </PageLayout>
  );
};

export default ProductPage;
