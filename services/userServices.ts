import { selectUser } from "../models/userModels";

export const findUserByUsername = async (userName: string) => {
  const data = await selectUser({ userName });
  console.log(data);
  return data;
};
