import { CreateCustomerDto } from "@/dtos/customer.dto";
import { insertCustomer, selectCustomers } from "@/models/customerModels";
import { Customer } from "@/types/customer";
import { PoolConnection } from "mysql2/promise";

export const customerServices = {
  createCustomer: async ({
    data,
    connection,
  }: {
    data: CreateCustomerDto;
    connection?: PoolConnection;
  }) => {
    try {
      const id = await insertCustomer({ data, connection });
      return id;
    } catch (e) {
      throw e;
    }
  },
  findCustomerByFields: async ({
    keyFields = {},
    connection,
  }: {
    keyFields?: Partial<Customer>;
    connection?: PoolConnection;
  }) => {
    try {
      const data = await selectCustomers({ connection, keyFields });
      return data;
    } catch (e) {
      throw e;
    }
  },
  findCustomerByStoreId: async ({
    keyFields = {},
    connection,
  }: {
    keyFields?: Partial<Customer>;
    connection?: PoolConnection;
  }) => {
    try {
    } catch (e) {}
  },
};
