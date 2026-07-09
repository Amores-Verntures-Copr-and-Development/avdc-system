import { CreateSaleDto } from "@/dtos/sales.dto";
import {
  LoyversePayments,
  LoyverseReceipt,
  LoyverseReceiptLineItem,
} from "@/types/loyverse-integration";
import { SalesPaymentStatus, SalesStatus } from "@/types/sales";

export async function processCreateSalesLoyverse({
  receipt,
}: {
  receipt: LoyverseReceipt;
}) {
  //check the receipt type
  try {
    if (receipt.receipt_type === "SALE") {
      const createSales: CreateSaleDto = {
        storeId: 0, // map Loyverse store_id to your local storeId
        salesCreatedBy: 0, // map employee_id later
        salesInvoice: receipt.receipt_number ?? "",
        salesNo: receipt.order ?? "",
        salesRemarks: receipt.note ?? "",
        salesStatus: SalesStatus.COMPLETED,

        salesSubTotal:
          Number(receipt.total_money ?? 0) +
          Number(receipt.total_discount ?? 0),
        salesTotalAmount: Number(receipt.total_money ?? 0),
        salesTotalPaid: Number(receipt.total_money ?? 0),

        saleDiscounts: receipt.total_discounts ?? [],

        salesItems: (receipt.line_items ?? []).map(
          (item: LoyverseReceiptLineItem) => ({
            //get the prodvar ID and the inventoryItemId by item_id
            salesId: 0,
            salesItemPrice: Number(item.price),
            salesItemQuantity: Number(item.quantity),
            salesItemSubtotal: Number(item.gross_total_money),
            salesItemTotal: Number(item.total_money),
            salesItemDiscounts: [],
            prodVarId: 0,
            inventoryItemId: 0,
          }),
        ),

        salesPayments: (receipt.payments ?? []).map(
          (payment: LoyversePayments) => ({
            //   paymentMethodId: 0, // map Loyverse payment name/type to your local paymentMethodId
            //   amount: Number(payment.money_amount ?? 0),
            //   referenceNo: payment.payment_id ?? "",
            salesId: 0,
            salesPaymentAmount: Number(payment.money_amount),
            salesPaymentStatus: SalesPaymentStatus.COMPLETED,
            paymentReference: "",
            payMetId: 0,
          }),
        ),

        customerId: 0, // map customer_id later
      };

      //check if customer id is null
    }

    if (receipt.receipt_type === "REFUND") {
      //contine refund process
    }
  } catch (e) {}
}
