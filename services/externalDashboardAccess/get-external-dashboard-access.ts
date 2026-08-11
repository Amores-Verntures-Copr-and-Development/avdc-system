import { selectExternalDashboardAccessByUserId } from "@/models/externalDashboardAccessModel";

export async function getExternalDashboardAccessByUserId(userId: number) {
  return selectExternalDashboardAccessByUserId({ userId });
}
