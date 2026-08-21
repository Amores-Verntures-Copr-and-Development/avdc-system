import {
  CreateCustomerDto,
  CustomerLoginDto,
  RegisterCustomerAccountDto,
  UpdateCustomerProfileDto,
} from "@/dtos/customer.dto";
import {
  CustomerAccountService,
  customerServices,
} from "@/services/customer/customerServices";
import { Customer } from "@/types/customer";
import { StoreInterface } from "@/types/stores";
import { error } from "console";

export const createCustomer = async (data: CreateCustomerDto[]) => {
  try {
    const result = await customerServices.createCustomer({ data });
    return {
      success: true,
      message: "Customer added successfully!",
      data: result,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to add customer!",
      error: e,
    };
  }
};

export const registerCustomerOnlineController = async (
  data: RegisterCustomerAccountDto,
) => {
  try {
    const res = await customerServices.registerCustomerAccount({
      data,
    });
    return {
      success: true,
      message: "Customer registered successfully!",
      data: res,
    };
  } catch (e) {
    console.log({ e });
    return {
      success: false,
      message: "Failed to register customer!",
      error: e,
    };
  }
};

export const loginCustomerController = async (data: CustomerLoginDto) => {
  try {
    const res = await customerServices.loginCustomerAccount(data);
    return {
      success: true,
      message: "Login successful!",
      data: res,
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to login!",
      error: e,
    };
  }
};

export const createCustomerMultipleStore = async (
  data: CreateCustomerDto[],
  store: StoreInterface[],
) => {
  try {
    const result = await customerServices.createCustomerMultipleStore({
      data,
      stores: store,
    });
    return {
      success: true,
      message: "Customer added successfully!",
      data: result,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to add customer!",
      error: e,
    };
  }
};
export const getCustomer = async ({
  keyFields = {},
  search,
  limit,
  offset,
  type,
  store,
  from,
  to,
  sort,
  order,
  paymentMethods,
}: {
  keyFields?: Partial<Customer>;
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
    const data = await customerServices.findCustomerByFields({
      keyFields,
      type,
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
    const count = await customerServices.countCustomerByStoreId({
      keyFields,
      type,
      search,
      store,
      from,
      to,
      paymentMethods,
    });
    return {
      success: true,
      message: "Customer fetched successfully!",
      data: data,
      count: count.totalCustomer,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetched customer!",
      error: e,
    };
  }
};

export const getCustomerMeController = async ({
  cusAccId,
  customerId,
}: {
  cusAccId: number;
  customerId: number;
}) => {
  try {
    const accounts = await CustomerAccountService.get({
      keyFields: { cusAccId },
    });
    const account = accounts[0];

    if (!account) {
      throw new Error("Customer account not found.");
    }

    const customers = await customerServices.findCustomerByFields({
      keyFields: { customerId },
    });

    const { password, ...safeAccount } = account;

    return {
      success: true,
      message: "Customer fetched successfully!",
      data: {
        ...safeAccount,
        customer: customers[0] ?? null,
      },
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to fetch customer!",
      error: e,
    };
  }
};

export const updateCustomerProfileController = async ({
  cusAccId,
  customerId,
  updateData,
}: {
  cusAccId: number;
  customerId: number;
  updateData: UpdateCustomerProfileDto;
}) => {
  try {
    const { firstName, middleName, lastName, company, customerPhone, customerAddress } =
      updateData;

    const accountFields: Partial<{
      firstName: string;
      middleName: string | null;
      lastName: string;
      company: string | null;
    }> = {};
    if (firstName !== undefined) accountFields.firstName = firstName;
    if (middleName !== undefined) accountFields.middleName = middleName;
    if (lastName !== undefined) accountFields.lastName = lastName;
    if (company !== undefined) accountFields.company = company;

    if (Object.keys(accountFields).length > 0) {
      await CustomerAccountService.update({
        cusAccId,
        updateData: accountFields,
      });
    }

    const customerFields: Partial<Customer> = {};
    if (customerPhone !== undefined) customerFields.customerPhone = customerPhone;
    if (customerAddress !== undefined)
      customerFields.customerAddress = customerAddress;
    // Keep the derived display name in sync, same convention used at
    // registration (customerName = first + last).
    if (firstName !== undefined || lastName !== undefined) {
      const accounts = await CustomerAccountService.get({
        keyFields: { cusAccId },
      });
      const current = accounts[0];
      const nextFirst = firstName ?? current?.firstName ?? "";
      const nextLast = lastName ?? current?.lastName ?? "";
      customerFields.customerName = `${nextFirst} ${nextLast}`.trim();
    }

    if (Object.keys(customerFields).length > 0) {
      await customerServices.updateCustomerByFields({
        keyFields: ["customerId"],
        updateData: [{ customerId, ...customerFields }],
      });
    }

    const accounts = await CustomerAccountService.get({
      keyFields: { cusAccId },
    });
    const account = accounts[0];
    if (!account) {
      throw new Error("Customer account not found.");
    }

    const customers = await customerServices.findCustomerByFields({
      keyFields: { customerId },
    });

    const { password, ...safeAccount } = account;

    return {
      success: true,
      message: "Profile updated successfully!",
      data: {
        ...safeAccount,
        customer: customers[0] ?? null,
      },
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update profile!",
      error: e,
    };
  }
};

export const updateCustomerController = async ({
  keyFields = ["customerId"],
  updateData,
}: {
  keyFields?: (keyof Customer)[];
  updateData: Partial<Customer>[];
}) => {
  try {
    const data = await customerServices.updateCustomerByFields({
      keyFields: keyFields,
      updateData,
    });
    return {
      success: true,
      message: "Customer updated successfully!",
      data: data,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to update customer!",
      error: e,
    };
  }
};
