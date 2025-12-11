import Button from "@/components/shared/Button";
import DropDownSearchItem from "@/components/shared/DropDownSearchItem";
import DropdownSelect from "@/components/shared/DropdownSelect";
import DropDownSelectCategory from "@/components/shared/DropDownSelectCategory";
import Input from "@/components/shared/Input";
import Textarea from "@/components/shared/TextArea";
import { unitOptions } from "@/constants/dropdown-options";
import { CreateProductDtos } from "@/dtos/products.dto";
import { ItemInterface } from "@/types/items";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";

const AddProductModal = () => {
  const [selection, setSelection] = useState<"inventory" | "new">("new");
  const [formData, setFormData] = useState<CreateProductDtos>({
    prodCatId: null,
    storeId: 0,
    prodCreatedBy: 0,
    prodName: "",
  });
  const handleDataChange = handleChange(formData, setFormData);
  const handleAddProduct = async () => {
    console.log({ formData });
  };
  return (
    <div className="flex flex-col gap-2 w-full h-full">
      <span className="text-sm font-semibold"></span>

      <div className="flex flex-col">
        <div className="flex gap-2">
          <Input
            label={"Name"}
            sizes={"sm"}
            onChange={handleDataChange}
            value={formData.prodName}
          />
          <DropdownSelect
            label="Category"
            name={"Category"}
            value={undefined}
            options={[]}
            sizes={"sm"}
            onChange={handleDataChange}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-auto">
        <Button
          label="Cancel"
          color="secondary"
          size="sm"
          className="font-semibold"
        />
        <Button label="Add Product" size="sm" className="font-semibold" />
      </div>
    </div>
  );
};

export default AddProductModal;
