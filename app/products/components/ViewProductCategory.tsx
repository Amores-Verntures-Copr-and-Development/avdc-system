import Table, { Column } from "@/components/shared/Table";
import { ApiResponse } from "@/types/api";
import { ProductCategories } from "@/types/products";
import { fetcher } from "@/utils/fetcher";
import React from "react";
import useSWR from "swr";

interface ViewProductCategoryProps {
  storeId: number;
  onClose: () => void;
}

const ViewProductCategory = ({
  storeId,
  onClose,
}: ViewProductCategoryProps) => {
  const { data: reponse } = useSWR<ApiResponse<ProductCategories[]>>(
    storeId ? `/api/products/${storeId}/product-categories/` : null,
    fetcher,
  );
  console.log(reponse?.data);
  const prodCatColumns: Column<ProductCategories>[] = [
    { name: "#", key: "#", selector: (row, _index) => _index + 1 },
    { name: "Name", key: "prodCatName" },
    { name: "Date", key: "prodCatCreatedAt" },
    { name: "Name", key: "prodCatCreatedBy" },
    { name: "Name", key: "storeId" },
  ];
  return (
    <div className="flex flex-col">
      <Table columns={prodCatColumns} data={reponse?.data ?? []} />
    </div>
  );
};

export default ViewProductCategory;
