import { DisplayProductsDtos } from "@/dtos/products.dto";
import React from "react";

interface EditProductProps {
  data: DisplayProductsDtos | null;
  onClose: () => void;
  onSave: (updatedData: DisplayProductsDtos) => void;
}
const EditProduct = ({ data, onClose, onSave }: EditProductProps) => {
  return <div>EditProduct</div>;
};

export default EditProduct;
