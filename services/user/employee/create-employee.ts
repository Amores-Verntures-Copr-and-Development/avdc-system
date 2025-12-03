import { CreateEmployeeDto } from "@/dtos/user.dto";
import { insertEmployee } from "@/models/employeeModels";
import { PoolConnection } from "mysql2/promise";

export async function createEmployee(
  connection: PoolConnection,
  data: CreateEmployeeDto
) {
  try {
    const empId = await insertEmployee({ connection, data });
    return empId;
  } catch (e) {
    throw e;
  }
}
