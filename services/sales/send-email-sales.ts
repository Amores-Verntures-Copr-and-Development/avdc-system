import { PoolConnection } from "mysql2/promise";
import { getSalesServices } from "./get-sales";
import { getPaymentMethodServices } from "../payment-method/get-payment-method";
import { sendEmail } from "@/utils/send-email";
import { generateSalesEmailHTML } from "@/utils/email-html";
import { DisplaySalesDto } from "@/dtos/sales.dto";
import { customerServices } from "../customer/customerServices";
import { formatDateToWords } from "@/utils/formatDateToWords";

export interface SendSalesEmailResult {
  sent: boolean;
  reason?: string;
}

export async function sendEmailSalesBasePaymentMethods({
  connection,
  salesId,
  orderNumber,
  deliveryFee,
  force = false,
}: {
  connection?: PoolConnection;
  salesId: number;
  orderNumber?: string;
  deliveryFee?: number;
  // bypasses the payment method's `payMetIsEmail` gate - used for an
  // explicit "resend receipt" action, as opposed to the automatic
  // fire-and-forget send right after a sale is created.
  force?: boolean;
}): Promise<SendSalesEmailResult> {
  try {
    let isEmail: boolean = false;

    const salesData = await getSalesServices.findSalesBySaleId({
      salesId,
      includeSaleItems: true,
    });

    if (salesData.length === 0) {
      return { sent: false, reason: "Sale not found" };
    }

    const sales = salesData[0];

    if (!sales.paymentMethods?.length) {
      return { sent: false, reason: "Sale has no payment method on file" };
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

    if (!isEmail && !force) {
      return {
        sent: false,
        reason: "Payment method used isn't set up to send email receipts",
      };
    }

    const customers = await customerServices.findCustomerByFields({
      keyFields: { customerId: sales.customerId },
    });

    if (customers && customers.length === 0) {
      return { sent: false, reason: "Customer not found" };
    }

    const customer = customers[0];

    if (!customer.customerEmail || customer.customerEmail === "") {
      return { sent: false, reason: "Customer has no email on file" };
    }
    const isFromOrder = sales.salesSource === "order";
    const displayNo = isFromOrder && orderNumber ? orderNumber : sales.salesNo;
    await sendEmail({
      from: '"Amores Ventures Receipts" <noreply@amoresventures.com>',
      to: customer.customerEmail,
      subject: `Receipt - ${displayNo}`,
      html: generateSalesEmailHTML(
        sales as DisplaySalesDto,
        orderNumber,
        deliveryFee,
      ),
    });

    return { sent: true };
  } catch (e) {
    throw e;
  }
}
