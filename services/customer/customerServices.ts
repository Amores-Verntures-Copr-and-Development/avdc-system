import {
  CreateCustomerAccountDto,
  CreateCustomerDto,
  CustomerLoginDto,
  RegisterCustomerAccountDto,
} from "@/dtos/customer.dto";
import { getDBConnection } from "@/lib/db";
import {
  insertCustomer,
  insertCustomerAccount,
  selectCountCustomers,
  selectCustomerAcconts,
  selectCustomers,
  updateCustomerAccounts,
  updateCustomers,
} from "@/models/customerModels";
import { Customer, CustomerAccount } from "@/types/customer";
import { StoreInterface } from "@/types/stores";
import { compareValue, hashValue } from "@/utils/bcrypt";
import { generateCustomerTokens } from "@/utils/jwt";
import { PoolConnection } from "mysql2/promise";
import {
  CusEmailVerificationServices,
  sendVerificationCodeEmail,
} from "./customerEmailVerificationServices";

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
    from,
    to,
    sort,
    order,
    paymentMethods,
  }: {
    keyFields?: Partial<Customer>;
    connection?: PoolConnection;
    search?: string;
    type?: string;
    limit?: number;
    offset?: number;
    store?: string;
    from?: string;
    to?: string;
    sort?: string;
    order?: "asc" | "desc";
    paymentMethods?: string[];
  }) => {
    try {
      const data = await selectCustomers({
        connection,
        keyFields,
        search,
        limit,
        offset,
        store,
        from,
        to,
        sort,
        order,
        paymentMethods,
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
    from,
    to,
    paymentMethods,
  }: {
    keyFields?: Partial<Customer>;
    connection?: PoolConnection;
    search?: string;
    type?: string;
    store?: string;
    from?: string;
    to?: string;
    paymentMethods?: string[];
  }) => {
    try {
      const count = await selectCountCustomers({
        keyFields,
        connection,
        from,
        to,
        search,
        store,
        paymentMethods,
      });
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

  registerCustomerAccount: async ({
    data,
  }: {
    data: RegisterCustomerAccountDto;
  }) => {
    let insertedCustomerId: number | null = null;
    const pool = await getDBConnection();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const existingCustomer = await selectCustomers({
        keyFields: {
          customerEmail: data.customerEmail,
          storeId: data.storeId,
        },
        connection,
      });
      const isExistingCustomer = existingCustomer.length > 0;

      if (isExistingCustomer) {
        const existingCustomerAccount = await CustomerAccountService.get({
          keyFields: {
            email: data.customerEmail,
            customerId: existingCustomer[0].customerId,
          },
          connection,
        });

        if (existingCustomerAccount.length > 0) {
          throw new Error("Customer account already exists.");
        }
      }

      if (!isExistingCustomer) {
        const customerData: CreateCustomerDto[] = [
          {
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            customerType: data.customerType,
            customerSource: "online",
            customerCreatedBy: null,
            storeId: data.storeId,
            customerAddress: data.customerAddress,
          },
        ];
        insertedCustomerId = await insertCustomer({
          data: customerData,
          connection,
        });
      } else {
        insertedCustomerId = existingCustomer[0].customerId;
      }

      const hashPassword = await hashValue(data.password);
      const customerAccountData: CreateCustomerAccountDto = {
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        company: data.company,
        email: data.customerEmail,
        password: hashPassword,
        customerId: insertedCustomerId,
      };

      const cusAccId = await CustomerAccountService.create({
        data: [customerAccountData],
        connection,
      });
      const { code } = await CusEmailVerificationServices.create({
        cusAccId,
        connection,
      });

      await connection.commit();

      try {
        await sendVerificationCodeEmail({
          to: data.customerEmail,
          name: data.firstName,
          code,
        });
      } catch (e) {
        console.error("Failed to send verification email:", e);
      }
      return {
        cusAccId,
        customerId: insertedCustomerId,
        email: data.customerEmail,
      };
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  },

  loginCustomerAccount: async ({
    email,
    password,
    storeId,
  }: CustomerLoginDto) => {
    const customers = await selectCustomers({
      keyFields: { customerEmail: email, storeId },
    });
    const customer = customers[0];
    if (!customer) {
      throw new Error("Invalid email or password.");
    }

    const accounts = await CustomerAccountService.get({
      keyFields: { email, customerId: customer.customerId },
    });
    const account = accounts[0];
    if (!account) {
      throw new Error("Invalid email or password.");
    }

    const isMatch = await compareValue(password, account.password);
    if (!isMatch) {
      throw new Error("Invalid email or password.");
    }

    if (!account.emailVerified) {
      throw new Error(
        "Email is not verified. Please verify your email before logging in.",
      );
    }

    const { accessToken, refreshToken } = generateCustomerTokens(
      account.cusAccId,
      customer.customerId,
      account.email,
      storeId,
    );

    return {
      customer: {
        cusAccId: account.cusAccId,
        customerId: customer.customerId,
        firstName: account.firstName,
        middleName: account.middleName,
        lastName: account.lastName,
        email: account.email,
        storeId,
      },
      accessToken,
      refreshToken,
    };
  },
};

export const CustomerAccountService = {
  get: async ({
    connection,
    keyFields = {},
  }: {
    connection?: PoolConnection;
    keyFields?: Partial<Record<keyof CustomerAccount, any>>;
  }) => {
    return await selectCustomerAcconts({
      connection,
      keyFields,
    });
  },

  create: async ({
    data,
    connection,
  }: {
    data: CreateCustomerAccountDto[];
    connection?: PoolConnection;
  }) => {
    return await insertCustomerAccount({
      data,
      connection,
    });
  },

  update: async ({
    cusAccId,
    updateData,
    connection,
  }: {
    cusAccId: number;
    updateData: Partial<CustomerAccount>;
    connection?: PoolConnection;
  }) => {
    return await updateCustomerAccounts({
      cusAccId,
      updateData,
      connection,
    });
  },
};
