import { EmployeeInterface } from "@/types/employees";
import { UserInterface } from "@/types/users";

export type CreateUserDto = Pick<
  UserInterface,
  | "userFname"
  | "userLname"
  | "userMname"
  | "userName"
  | "userPassword"
  | "userEmail"
  | "userRole"
  | "userAddedBy"
> &
  Pick<EmployeeInterface, "empPosition" | "storeId">;

export type CreateEmployeeDto = Pick<
  EmployeeInterface,
  "empPosition" | "storeId" | "userId"
>;

export type DisplayUserDto = Pick<
  UserInterface,
  | "userId"
  | "userFname"
  | "userLname"
  | "userEmail"
  | "userRole"
  | "userAddedBy"
  | "userCreatedAt"
> &
  Pick<EmployeeInterface, "empId" | "empPosition" | "storeId"> & {
    addedBy: String;
  };
