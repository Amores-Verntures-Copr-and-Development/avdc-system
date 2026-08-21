export type UserRole = "superadmin" | "owner" | "employee" | null;
export type UserStatus = "active" | "inactive";
export interface UserInterface {
  userId: number;
  userName: string;
  userFname: string;
  userLname: string;
  userMname?: string | null;
  userPassword: string;
  userRole: UserRole;
  userEmail: string;
  userStatus: UserStatus;
  userAddedBy: number | null;
  userCreatedAt: string;
  userUpdatedAt: string;
  userDeletedAt: string;
  companyId: number | null;
}
