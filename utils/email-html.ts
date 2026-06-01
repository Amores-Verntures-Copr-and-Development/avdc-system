import { DisplaySalesDto } from "@/dtos/sales.dto";
import { formatDateToWords } from "./formatDateToWords";

export const generateSalesEmailHTML = (data: DisplaySalesDto) => {
  const itemsHTML =
    data.saleItems
      ?.map((item) => {
        const discountsHTML =
          item.salesItemDiscounts
            ?.map(
              (discount) => `
        <div style="font-size:11px;color:#16a34a;margin-top:2px;">
          ↳ ${discount.discountName} (-₱${Number(discount.discountAmount).toFixed(2)})
        </div>
      `,
            )
            .join("") ?? "";

        return `
<tr>
  <td style="padding:14px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">
    <div style="font-weight:600;">
      ${item.saleItemName ?? ""}
    </div>

    <div style="font-size:11px;color:#6b7280;margin-top:4px;">
      ₱${Number(item.salesItemPrice).toFixed(2)}
      ×
      ${item.salesItemQuantity}
      =
      ₱${Number(item.salesItemSubtotal).toFixed(2)}
    </div>

    ${discountsHTML}
  </td>

  <td align="center" style="padding:14px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">
    ${item.salesItemQuantity}
  </td>

  <td align="right" style="padding:14px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">
    ₱${Number(item.salesItemTotal).toFixed(2)}
  </td>
</tr>
`;
      })
      .join("") ?? "";

  const paymentMethodsHTML =
    data.paymentMethods
      ?.map(
        (payment) => `
          <tr>
            <td style="font-size:14px; color:#6b7280; padding-top:8px;">
              ${payment.payMetName}
            </td>
            <td align="right" style="font-size:14px; color:#374151; padding-top:8px;">
              ₱${Number(payment.salesPaymentAmount).toFixed(2)}
            </td>
          </tr>
        `,
      )
      .join("") ?? "";
  const salesDiscountsHTML =
    data.salesDiscounts
      ?.map(
        (discount) => `
        <tr>
          <td style="font-size:14px;color:#6b7280;">
            ${discount.discountName}
          </td>
          <td align="right" style="font-size:14px;color:#16a34a;">
            -₱${Number(discount.discountAmount).toFixed(2)}
          </td>
        </tr>
      `,
      )
      .join("") ?? "";

  return `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background:#f8fafc; font-family:Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:24px; text-align:center; border-bottom:1px solid #f1f5f9;">
                <h1 style="margin:0; color:#cc1478; font-size:24px;">${data.storeName ?? "Amores Ventures"}</h1>
                <p style="margin:6px 0 0; color:#6b7280; font-size:13px;">Your order summary</p>
              </td>
            </tr>

            <tr>
              <td style="padding:24px;">
                <h2 style="margin:0 0 8px; color:#1f2937; font-size:18px;">
                  Thank you for your purchase!
                </h2>

                <p style="margin:0 0 20px; color:#6b7280; font-size:14px;">
                  Hi ${data.customerName ?? "Customer"}, your payment has been successfully received.
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f8; border-radius:12px; padding:16px; margin-bottom:20px;">
                  <tr>
                    <td style="color:#6b7280; font-size:13px; padding-top:8px;">Order </td>
                    <td align="right" style="color:#1f2937; font-size:13px; font-weight:bold; padding-top:8px;">${data.salesNo}</td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280; font-size:13px; padding-top:8px;">Purchased on</td>
                    <td align="right" style="color:#1f2937; font-size:13px; font-weight:bold; padding-top:8px;">
                      ${formatDateToWords(data.salesCreatedAt, { showHour: true, showMinute: true })}
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <thead>
                    <tr>
                      <th align="left" style="padding:12px; background:#cc1478; color:#ffffff; font-size:12px;">Item</th>
                      <th align="center" style="padding:12px; background:#cc1478; color:#ffffff; font-size:12px;">Qty</th>
                      <th align="right" style="padding:12px; background:#cc1478; color:#ffffff; font-size:12px;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHTML}
                  </tbody>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                  <tr>
                    <td style="font-size:14px; color:#6b7280;">Subtotal</td>
                    <td align="right" style="font-size:14px; color:#374151;">₱${Number(data.salesSubTotal).toFixed(2)}</td>
                  </tr>
                  ${salesDiscountsHTML}

                  <tr>
                    <td style="font-size:16px; font-weight:bold; padding-top:12px;">
                      Total
                    </td>
                    <td align="right" style="font-size:16px; font-weight:bold;">
                      ₱${Number(data.salesTotalAmount).toFixed(2)}
                    </td>
                  </tr>

                  <tr>
                    <td colspan="2" style="padding-top:16px;">
                      <strong style="color:#374151;">Payment Methods</strong>
                    </td>
                  </tr>
                  ${paymentMethodsHTML}

                  <tr>
                    <td style="font-size:18px; font-weight:bold; padding-top:16px; color:#1f2937;">Total Paid</td>
                    <td align="right" style="font-size:18px; font-weight:bold; padding-top:16px; color:#cc1478;">
                      ₱${Number(data.salesTotalPaid).toFixed(2)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 24px; background:#f9fafb; text-align:center; color:#9ca3af; font-size:12px;">
                This is an automated receipt from Amores Ventures.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
