import { CreateCompanyDto, UpdateCompanyDto } from "@/dtos/company.dto";
import { AuthUser } from "@/lib/auth/getCurrentUser";
import {
  insertCompany,
  selectCompanies,
  updateCompany,
} from "@/models/companyModel";
import { selectCompanyOwners } from "@/models/userModels";

// Companies are the tenant boundary - only the platform-level superadmin
// manages them, never a company's own owner/employee.
function assertIsSuperAdmin(actingUser: AuthUser) {
  if (actingUser.userRole !== "superadmin") {
    throw new Error("Only Super Admin can manage companies");
  }
}

export const createCompanyController = async (
  data: CreateCompanyDto,
  actingUser: AuthUser,
) => {
  try {
    assertIsSuperAdmin(actingUser);
    const companyId = await insertCompany({ data });
    return {
      data: companyId,
      message: "Company created successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: e instanceof Error ? e.message : "Failed to create company!",
      success: false,
    };
  }
};

export const getCompaniesController = async (
  actingUser: AuthUser,
  search?: string,
) => {
  try {
    assertIsSuperAdmin(actingUser);
    const data = await selectCompanies({ search });
    return {
      data,
      message: "Companies fetched successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: e instanceof Error ? e.message : "Failed to fetch companies!",
      success: false,
    };
  }
};

export const getCompanyByIdController = async (
  companyId: number,
  actingUser: AuthUser,
) => {
  try {
    assertIsSuperAdmin(actingUser);
    const [data] = await selectCompanies({ keyFields: { companyId } });
    return {
      data: data ?? null,
      message: "Company fetched successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: e instanceof Error ? e.message : "Failed to fetch company!",
      success: false,
    };
  }
};

export const getCompanyOwnersController = async (
  companyId: number,
  actingUser: AuthUser,
) => {
  try {
    assertIsSuperAdmin(actingUser);
    const data = await selectCompanyOwners({ companyId });
    return {
      data,
      message: "Company owners fetched successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: e instanceof Error ? e.message : "Failed to fetch company owners!",
      success: false,
    };
  }
};

export const updateCompanyController = async (
  data: UpdateCompanyDto,
  actingUser: AuthUser,
) => {
  try {
    assertIsSuperAdmin(actingUser);
    const result = await updateCompany({ updates: [data] });
    return {
      data: result,
      message: "Company updated successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: e instanceof Error ? e.message : "Failed to update company!",
      success: false,
    };
  }
};
