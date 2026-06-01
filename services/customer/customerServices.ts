import { CreateCustomerDto } from "@/dtos/customer.dto";
import { getDBConnection } from "@/lib/db";
import {
  insertCustomer,
  selectCountCustomers,
  selectCustomers,
  updateCustomers,
} from "@/models/customerModels";
import { Customer } from "@/types/customer";
import { StoreInterface } from "@/types/stores";
import { PoolConnection } from "mysql2/promise";

export const customerServices = {
  createCustomer: async ({
    data,
    connection,
  }: {
    data: CreateCustomerDto[];
    connection?: PoolConnection;
  }) => {
    try {
      const id = await insertCustomer({ data, connection });
      return id;
    } catch (e) {
      throw e;
    }
  },
  createCustomerMultipleStore: async ({
    data,
    connection,
    stores,
  }: {
    data: CreateCustomerDto[];
    stores: StoreInterface[];
    connection?: PoolConnection;
  }) => {
    let localConnection = false;
    let newConnection: any;

    if (stores.some((s) => !s.storeId)) {
      throw new Error("No stores!");
    }
    if (!connection) {
      localConnection = true;
      const newPool = await getDBConnection();
      newConnection = await newPool.getConnection();
      await newConnection.beginTransaction();
    }
    try {
      // Start transaction

      const rowsToInsert: CreateCustomerDto[] = [];

      data.forEach((customer) => {
        stores.forEach((store) => {
          rowsToInsert.push({
            customerName: customer.customerName,
            customerEmail: customer.customerEmail,
            customerPhone: customer.customerPhone,
            customerType: customer.customerType,
            customerCreatedBy: customer.customerCreatedBy,
            storeId: store.storeId ?? 0,
            customerAddress: customer.customerAddress,
          });
        });
      });

      // Bulk insert with the same connection

      await insertCustomer({
        data: rowsToInsert,
        connection: connection ? connection : newConnection,
      });

      // Commit transaction
      if (localConnection) {
        await newConnection.commit();
      }

      return rowsToInsert.length;
    } catch (e) {
      if (localConnection) {
        await newConnection.rollback();
      }
      throw e;
    } finally {
      // Optional: close connection if it was created here
      if (localConnection) {
        await newConnection.release();
      }
    }
  },
  findCustomerByFields: async ({
    keyFields = {},
    connection,
    search,
    type,
    limit,
    offset,
    store,
  }: {
    keyFields?: Partial<Customer>;
    connection?: PoolConnection;
    search?: string;
    type?: string;
    limit?: number;
    offset?: number;
    store?: string;
  }) => {
    try {
      const data = await selectCustomers({
        connection,
        keyFields,
        search,
        limit,
        offset,
        store,
      });
      return data;
    } catch (e) {
      throw e;
    }
  },

  countCustomerByStoreId: async ({
    keyFields = {},
    connection,
    store,
    search,
  }: {
    keyFields?: Partial<Customer>;
    connection?: PoolConnection;
    search?: string;
    type?: string;
    store?: string;
  }) => {
    try {
      const count = await selectCountCustomers({ keyFields, connection });
      return count;
    } catch (e) {
      throw e;
    }
  },

  updateCustomerByFields: async ({
    keyFields = ["customerId"],
    updateData,
    connection,
  }: {
    keyFields?: (keyof Customer)[];
    updateData: Partial<Customer>[];
    connection?: PoolConnection;
  }) => {
    return await updateCustomers({
      keyFields: keyFields,
      updates: updateData,
      connection,
    });
  },
};
