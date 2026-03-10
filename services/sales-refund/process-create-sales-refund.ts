import {
  CreateSaleItemRefundDto,
  CreateSalePaymentRefundDto,
  CreateSalesRefundDto,
} from "@/dtos/sales-refund.dto";
import { getDBConnection } from "@/lib/db";
import { createSalesRefund } from "./create-sales-refunds";
import { createSalesItemRefund } from "./sales-item-refund/create-sales-item-refund";
import { createSalesPaymentRefund } from "./sales-payment-refund/create-sales-payment-refund";
import { CreateTransactionDto } from "@/dtos/transaction.dto";
import { createTransactions } from "../transaction/create-transaction";
import {
  getOwnInfoForRefund,
  getStoreSuperVisorForRefund,
} from "../user/get-user";
import bcrypt from "bcryptjs";

export async function processCreateSaleRefund({
  data,
  decoded,
  password,
}: {
  data: CreateSalesRefundDto;
  password: string;
  decoded: {
    userId: number;
    userRole: string;
    userFullName: string;
    empPosition: string;
    storeId: number | null;
  };
}) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    //validate first the user
    //insert first salesRefundDto
    if (!data) {
      throw new Error("No data found for sales refund!");
    }
    if (data.salesItemRefunds?.length === 0) {
      throw new Error("No data found for sales item refund!");
    }
    if (data.salesPaymentRefunds?.length === 0) {
      throw new Error("No data found for sales payment refund!");
    }

    if (decoded.empPosition === "staff") {
      if (!password) throw new Error("Supervisor password required!");

      const supervisors = await getStoreSuperVisorForRefund({
        storeId: data.storeId,
        connection: connection,
      });

      const validSupervisor = supervisors.some((s) =>
        bcrypt.compareSync(password, s.userPassword),
      );

      if (!validSupervisor) {
        throw new Error("Invalid supervisor password!");
      }
    } else {
      const user = await getOwnInfoForRefund({
        connection,
        userId: decoded.userId,
      });
      if (!user) {
        throw new Error("Invalid supervisor password!");
      }
      const validUser = bcrypt.compareSync(password, user[0].userPassword);

      if (!validUser) {
        throw new Error("Invalid password!");
      }
    }

    const refundId = await createSalesRefund({ connection: connection, data });

    if (data.salesItemRefunds && data.salesItemRefunds.length > 0) {
      const createSaleItemsRefundData: CreateSaleItemRefundDto[] =
        data.salesItemRefunds.map((i) => ({
          ...i,
          salesRefId: refundId,
        }));
      await createSalesItemRefund({
        connection: connection,
        data: createSaleItemsRefundData,
      });
    }

    if (data.salesPaymentRefunds && data.salesPaymentRefunds) {
      const createSalesPaymentRefundData: CreateSalePaymentRefundDto[] =
        data.salesPaymentRefunds.map((i) => ({
          ...i,
          salesRefId: refundId,
        }));
      await createSalesPaymentRefund({
        connection: connection,
        data: createSalesPaymentRefundData,
      });
    }

    const transactionData: CreateTransactionDto = {
      storeId: data.storeId,
      transactionAmount: data.salesRefAmount,
      transactionRef: "refund",
      transactionType: "out",
      transactionCreatedBy: data.salesRefCreatedBy,
      referenceId: refundId,
    };

    await createTransactions({ connection: connection, data: transactionData });
    //check if all items is

    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    await connection.beginTransaction();
  }
}
