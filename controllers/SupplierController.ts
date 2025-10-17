import { CreateSupplierDto, CreateSupplierItemDto } from "@/dtos/supplier.dto";
import {
  addItemSupplierByID,
  createSupplier,
  findAllSuppliers,
  findSupplierItemById,
} from "@/services/supplierServices";

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

export const getSupplier = async () => {
  try {
    const data = await findAllSuppliers();
    return {
      success: true,
      message: "Supplier fetched successfully",
      data: data ?? null,
    };
  } catch (e) {
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
