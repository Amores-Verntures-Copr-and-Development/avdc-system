import { CreateSupplierDto, CreateSupplierItemDto } from "@/dtos/supplier.dto";
import { getSupplierBySearch } from "@/services/supplier/get-supplier";
import { createSupplierItems } from "@/services/supplier/suppplier-items/create-supplier-items";
import { handleDeleteSupplierItems } from "@/services/supplier/suppplier-items/update-supplier-items";
import {
  addItemSupplierByID,
  createSupplier,
  findAllSuppliers,
  findSupplierItemById,
} from "@/services/supplierServices";
import { SupplierItem } from "@/types/supplier";

export const addSupplier = async (data: CreateSupplierDto) => {
  try {
    await createSupplier(data);
    return {
      success: true,
      message: "Supplier created successfully",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to create Supplier",
      error: e,
    };
  }
};

export const getSupplier = async ({ search }: { search?: string }) => {
  try {
    let data;
    if (search) {
      data = await getSupplierBySearch(search);
    } else {
      data = await findAllSuppliers();
    }

    return {
      success: true,
      message: "Supplier fetched successfully",
      data: data ?? null,
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: "Failed to fetched Supplier",
      error: e,
    };
  }
};

export const addItemSupplier = async (data: CreateSupplierItemDto) => {
  try {
    await addItemSupplierByID(data);
    return {
      success: true,
      message: "Item added to supplier successfully!",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to add item in supplier!",
      error: e,
    };
  }
};

export const addItemsSupplier = async (data: CreateSupplierItemDto[]) => {
  try {
    await createSupplierItems({ data });
    return {
      success: true,
      message: "Items added to supplier successfully!",
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: "Failed to add items in supplier!",
      error: e,
    };
  }
};

export const getSupplierItemById = async (suppId: number) => {
  try {
    const data = await findSupplierItemById(suppId);
    return {
      success: true,
      message: "Supplier item fetched successfully",
      data: data ?? null,
    };
  } catch (e) {
    console.log(e);
    return {
      success: false,
      message: "Failed to fetched Supplier item",
      error: e,
    };
  }
};

export const updateSupplierItems = async ({
  data,
  controller,
}: {
  data: SupplierItem[];
  controller: "update" | "delete";
}) => {
  let message = "";
  try {
    switch (controller) {
      case "update": {
        // await handleUpdateSupplierItems(data);
        // message = "Supplier items updated successfully!";
        break;
      }

      case "delete": {
        await handleDeleteSupplierItems(data);
        message = "Supplier items deleted successfully!";
        break;
      }

      default:
        const exhaustiveCheck: never = controller;
        throw new Error(`Unsupported controller action: ${controller}`);
    }

    return {
      success: true,
      message: message,
      data: data,
    };
  } catch (error) {
    console.error(`Supplier items ${controller} error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      data: data,
    };
  }
};
