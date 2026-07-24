import {
  CreateSaleDto,
  CreateSaleItemDto,
  CreateSalePaymentDto,
} from "@/dtos/sales.dto";
import { SalesPaymentStatus, SalesStatus } from "@/types/sales";
import { getProductVariants } from "../products/product-variant/get-product-variants";
import { processCreateSales } from "../sales/process-create-sales";
import { getOrders } from "./get-order";
import { getOrderItemsByOrderId } from "./order-items/get-order-items";
import { updateOrderByFields } from "./update-order";

export async function processCompleteOrder({
  storeId,
  orderId,
  completedBy,
}: {
  storeId: number;
  orderId: number;
  completedBy: number;
}) {
  const { data: orders } = await getOrders({ keyFields: { storeId, orderId } });
  const order = orders[0];

  if (!order) {
    throw new Error("Order not found");
  }

  const items = await getOrderItemsByOrderId({ orderId });

  if (!items || items.length === 0) {
    throw new Error("Order has no items to complete");
  }

  const { data: variants } = await getProductVariants({ storeId });
  const variantByProdVarId = new Map(variants.map((v) => [v.prodVarId, v]));

  const salesItems: CreateSaleItemDto[] = items.map((item) => {
    const variant = variantByProdVarId.get(item.prodVarId);
    const lineTotal = Number(item.quantity) * Number(item.unitPrice);

    return {
      salesId: 0,
      prodVarId: item.prodVarId,
      salesItemQuantity: item.quantity,
      salesItemPrice: item.unitPrice,
      salesItemSubtotal: lineTotal,
      salesItemTotal: lineTotal,
      inventoryItemId: variant?.inventoryItemId ?? null,
      components: variant?.variantComponents ?? [],
    };
  });

  const salesPayments: CreateSalePaymentDto[] = [
    {
      salesId: 0,
      payMetId: order.payMetId,
      salesPaymentAmount: order.totalAmount,
      paymentReference: order.paymentReference ?? "",
      salesPaymentStatus: SalesPaymentStatus.COMPLETED,
    },
  ];

  const saleData: CreateSaleDto = {
    customerId: order.customerId,
    salesCreatedBy: completedBy,
    salesSubTotal: order.subtotal,
    salesTotalPaid: order.totalAmount,
    salesInvoice: "",
    salesNo: "",
    salesTotalAmount: order.totalAmount,
    storeId: order.storeId,
    salesStatus: SalesStatus.COMPLETED,
    salesRemarks: `Converted from Order ${order.orderNumber}`,
    salesSource: "order",
    salesItems,
    salesPayments,
  };

  const sales = await processCreateSales(saleData);

  await updateOrderByFields({
    data: {
      orderId,
      orderStatus: "COMPLETED",
      paymentStatus: "PAID",
    },
  });

  return sales;
}
