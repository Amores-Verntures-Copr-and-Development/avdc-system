import { PoolConnection } from "mysql2/promise";
import { getSalesServices } from "./get-sales";
import { getPaymentMethodServices } from "../payment-method/get-payment-method";

export async function sendEmailSalesBasePaymentMethods({
  connection,
  salesId,
}: {
  connection?: PoolConnection;
  salesId: number;
}) {
  try {
    let isEmail: boolean = false;
    //get sales

    const salesData = await getSalesServices.findSalesBySaleId({
      salesId,
      includeSaleItems: true,
    });

    if (salesData.length === 0) {
      return;
    }

    const sales = salesData[0];

    if (!sales.salePayments?.length) {
      return;
    }
    for (const pm of sales.salePayments) {
      //check sales payments if one has isEmail

      const paymentMethod =
        await getPaymentMethodServices.findPaymentMethodByKeyFields({
          keyFields: {
            payMetId: pm.payMetId,
          },
        });

      if (paymentMethod.length === 0) {
        continue;
      }

      if (Boolean(paymentMethod[0].payMetIsEmail) === true) {
        isEmail = true;
      }
    }

    if (!isEmail) {
      return;
    }

    console.log({ isEmail });

    //generate Email Body Format

    //if no just return
    //check if their is customer
    //if customer exist, get customer
    //if has customer email
    //generate a email for customer and only send the payment method with isEmail total
  } catch (e) {}
}
