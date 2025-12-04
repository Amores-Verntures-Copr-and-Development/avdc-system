import { CreateEmployeeDto, CreateUserDto } from "@/dtos/user.dto";
import { getDBConnection } from "@/lib/db";
import { createUser } from "./create-user";
import { createEmployee } from "./employee/create-employee";
import { CreateStoreEmployeeDto } from "@/dtos/store.dto";
import { createStoreEmployees } from "../store/store-employee/create-store-employee";

export const handleCreateUser = async (data: CreateUserDto) => {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    console.log({ data });
    await connection.beginTransaction();
    const userId = await createUser(connection, data);
    if (data.userRole === "employee") {
      const newEmployeeData: CreateEmployeeDto = {
        userId: userId,
        empPosition: data.empPosition,
        storeId: data.storeId,
      };
      const empId = await createEmployee(connection, newEmployeeData);
      if (data.empPosition === "supervisor" || data.empPosition === "staff") {
        const storeEmployeeData: CreateStoreEmployeeDto[] =
          data.storeEmployee?.map((store) => ({
            ...store,
            empId: empId,
            storeEmpCreatedBy: data.userAddedBy ?? 0,
          })) ?? [];

        await createStoreEmployees({ connection, data: storeEmployeeData });
      }
    }
    await connection.commit();
  } catch (e) {
    console.log(e);
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
};
