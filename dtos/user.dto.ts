import { EmployeeInterface } from "@/types/employees";
import { UserInterface } from "@/types/users";
import { CreateStoreEmployeeDto } from "./store.dto";
import { StoreInterface } from "@/types/stores";

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
  Pick<EmployeeInterface, "empPosition" | "storeId"> & {
    storeEmployee?: CreateStoreEmployeeDto[];
  };

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
    fullName: string;
  };

export type DisplayUserInfoDto = Pick<
  UserInterface,
  | "userId"
  | "userFname"
  | "userMname"
  | "userLname"
  | "userEmail"
  | "userRole"
  | "userAddedBy"
  | "userCreatedAt"
  | "userStatus"
  | "userUpdatedAt"
> &
  Pick<
    EmployeeInterface,
    | "empId"
    | "empPosition"
    | "storeId"
    | "empCreatedAt"
    | "empDeletedAt"
    | "empUpdatedAt"
    | "userId"
  > & {
    storeEmployees: StoreInterface[];
  };
