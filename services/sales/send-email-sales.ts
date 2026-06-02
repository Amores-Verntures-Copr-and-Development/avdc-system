import { PoolConnection } from "mysql2/promise";
import { getSalesServices } from "./get-sales";
import { getPaymentMethodServices } from "../payment-method/get-payment-method";
import { sendEmail } from "@/utils/send-email";
import { generateSalesEmailHTML } from "@/utils/email-html";
import { DisplaySalesDto } from "@/dtos/sales.dto";
import { customerServices } from "../customer/customerServices";

export async function sendEmailSalesBasePaymentMethods({
  connection,
  salesId,
}: {
  connection?: PoolConnection;
  salesId: number;
}) {
  try {
    let isEmail: boolean = false;

    const salesData = await getSalesServices.findSalesBySaleId({
      salesId,
      includeSaleItems: true,
    });

    if (salesData.length === 0) {
      return;
    }

    const sales = salesData[0];

    if (!sales.paymentMethods?.length) {
      return;
    }
    for (const pm of sales.paymentMethods) {
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

    const customers = await customerServices.findCustomerByFields({
      keyFields: { customerId: sales.customerId },
    });

    if (customers && customers.length === 0) {
      return;
    }

    const customer = customers[0];

    if (!customer.customerEmail || customer.customerEmail === "") {
      return;
    }
    await sendEmail({
      from: '"Amores Ventures Receipts" <noreply@amoresventures.com>',
      to: customer.customerEmail,
      subject: `Receipt - ${sales.salesNo}`,
      html: generateSalesEmailHTML(sales as DisplaySalesDto),
    });
  } catch (e) {
    throw e;
  }
}
