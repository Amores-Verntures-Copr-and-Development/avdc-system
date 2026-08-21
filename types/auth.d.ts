export interface UserAuthInterface {
  username: string;
  password: string;
}

export interface UserAccessToken {
  userId: number;
  userFname: string;
  userLname: string | null;
  userRole: string;
  empPosition: number;
  storeId: number | null;
  companyId: number | null;
}
