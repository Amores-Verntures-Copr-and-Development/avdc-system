import Table, { Column } from "@/components/shared/Table";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { UserAuth } from "@/hooks/useSession";
import React, { useState } from "react";
import Button from "@/components/shared/Button";
import { CreateProductDtos } from "@/dtos/products.dto";
interface AddItemToProductModalProps {
  data: DisplayInventoryItems[];
  onCancel: () => void;
  onSubmit: (prodcuts: CreateProductDtos[]) => Promise<boolean>;
  user?: UserAuth | null;
}

const AddItemToProductModal = ({
  onCancel,
  onSubmit,
}: AddItemToProductModalProps) => {
  const [products, setProducts] = useState<CreateProductDtos[]>([]);
  const columns: Column<CreateProductDtos>[] = [
    { name: "#", key: "#", selector: (_row, index) => index + 1 },
    // {
    //   name: "Item Name",
    //   key: "itemName",
    //   selector: (row) =>
    //     data.find((i) => i.inventoryItemId === row.inventoryItemId)?.itemName,
    // },
    // {
    //   name: "Unit",
    //   key: "itemUnit",
    //   selector: (row) =>
    //     data.find((i) => i.inventoryItemId === row.inventoryItemId)?.itemUnit,
    // },
    // {
    //   name: "Category",
    //   key: "categoryName",
    //   selector: (row) =>
    //     data.find((i) => i.inventoryItemId === row.inventoryItemId)
    //       ?.categoryName,
    // },
    // {
    //   name: "Cost  Price",
    //   key: "itemPrice",
    //   selector: (row) =>
    //     data.find((i) => i.inventoryItemId === row.inventoryItemId)?.itemPrice,
    // },
    {
      name: "Selling  Price",
      key: "productPrice",
      editable: true,
      inputType: "number",
    },
  ];
  // useEffect(() => {
  //   if (data) {
  //     setProducts(
  //       data.map((item) => ({
  //         productCode: "",
  //         productCreatedBy: 0,
  //         productDescription: "",
  //         productPrice: 0,
  //         inventoryItemId: item.inventoryItemId,
  //         inventoryId: 0,
  //         isDeduct: 1,
  //       }))
  //     );
  //   }
  // }, [data]);

  const handleSubmit = async () => {
    const success = await onSubmit(products);
    if (success) {
      onCancel();
    }
  };
  return (
    <div className="flex flex-col gap-5">
      <span className="font-semibold text-sm">
        Notes:{" "}
        <span className="text-sm font-normal">
          This items will be included to your products.
        </span>
      </span>
      <div>
        <Table columns={columns} data={products} updateData={setProducts} />
      </div>
      <div className="flex justify-end gap-2">
        <div>
          <Button
            label="Cancel"
            color="secondary"
            size="sm"
            onClick={onCancel}
            className="font-semibold"
          />
        </div>
        <div>
          <Button
            label="Add Item"
            size="sm"
            onClick={handleSubmit}
            className="font-semibold"
          />
        </div>
      </div>
    </div>
  );
};

export default AddItemToProductModal;
