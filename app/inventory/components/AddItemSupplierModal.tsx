import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { UserAuth } from "@/hooks/useSession";
import React from "react";
import { AddItemToStoreDto } from "../InventoryPage";
interface AddItemSupplierModalProps {
  data: DisplayInventoryItems[];
  onCancel: () => void;
  onSubmit: (items: AddItemToStoreDto) => Promise<boolean>;
  user?: UserAuth | null;
}
const AddItemSupplierModal = () => {
  return <div>AddItemSupplierModal</div>;
};

export default AddItemSupplierModal;
