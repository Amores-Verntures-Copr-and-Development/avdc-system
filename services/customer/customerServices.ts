import { CreateCustomerDto } from "@/dtos/customer.dto";
import {
  insertCustomer,
  selectCountCustomers,
  selectCustomers,
} from "@/models/customerModels";
import { Customer } from "@/types/customer";
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
      console.log({ e });
      throw e;
    }
  },
  findCustomerByFields: async ({
    keyFields = {},
    connection,
    search,
    type,
    limit,
    offset,
  }: {
    keyFields?: Partial<Customer>;
    connection?: PoolConnection;
    search?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }) => {
    try {
      const data = await selectCustomers({
        connection,
        keyFields,
        search,
        limit,
        offset,
      });
      return data;
    } catch (e) {
      throw e;
    }
  },

  countCustomerByStoreId: async ({
    keyFields = {},
    connection,
  }: {
    keyFields?: Partial<Customer>;
    connection?: PoolConnection;
    search?: string;
    type?: string;
  }) => {
    try {
      const count = await selectCountCustomers({ keyFields, connection });
      return count;
    } catch (e) {
      throw e;
    }
  },
};
