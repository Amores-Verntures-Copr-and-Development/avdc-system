import { CreateSupplierDto, CreateSupplierItemDto } from "@/dtos/supplier.dto";
import { getDBConnection } from "@/lib/db";
import {
  insertSupplier,
  insertSupplierItem,
  insertSupplierItems,
  selectCountSupplier,
  selectSupplier,
  selectSupplierItems,
} from "@/models/supplierModels";

export async function createSupplier(data: CreateSupplierDto) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const supplierCount = await selectCountSupplier(connection);
    const generateSupplierNo = `SUP-${(supplierCount.total + 1)
      .toString()
      .padStart(3, "0")}`;
    const supplierData: CreateSupplierDto = {
      ...data,
      suppCode: generateSupplierNo,
    };
    const supplierId = await insertSupplier({ connection, data: supplierData });
    await connection.commit();
    return supplierId;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}

export async function findAllSuppliers() {
  try {
    const data = await selectSupplier({});
    return data;
  } catch (e) {
    throw e;
  }
}

export async function addItemSupplierByID(data: CreateSupplierItemDto) {
  try {
    await insertSupplierItem({ data });
  } catch (e) {
    throw e;
  }
}

export async function addItemsSupplierByID(data: CreateSupplierItemDto[]) {
  try {
    await insertSupplierItems({ data });
  } catch (e) {
    throw e;
  }
}

export async function findSupplierItemById(suppId: number) {
  try {
    const data = await selectSupplierItems({ suppId });
    return data;
  } catch (e) {
    throw e;
  }
}
