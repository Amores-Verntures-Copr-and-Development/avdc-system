import Button from "@/components/shared/Button";
import LoaderComponent from "@/components/shared/LoaderComponent";
import { DisplaySalesDto, DisplaySalesItems } from "@/dtos/sales.dto";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { formatDiscountValue } from "../../pos/components/sidebar/DiscountList";
import { DropdownSearch } from "@/components/shared/DropDownSearch";
import DropdownSelect from "@/components/shared/DropdownSelect";
import Input from "@/components/shared/Input";
import { Customer } from "@/types/customer";
import { SalePayments, Sales } from "@/types/sales";
import { PaymentMethods } from "@/types/payment-methods";
import { DropdownOption } from "@/components/shared/DynamicDropdown";
import { handleArrayItemChange } from "@/utils/handle-change";
import toast from "react-hot-toast";

interface EditSalesPageProps {
  salesData: DisplaySalesDto | null;
  onBack: () => void;
  mutateSales: () => void;
}

interface EditableItem {
  salesItemId: string | number;
  prodName: string;
  prodVarName: string;
  salesItemPrice: number;
  salesItemQuantity: number;
  salesItemSubtotal: number;
  salesItemTotal: number;
  salesItemsDiscount: {
    discountType: string;
    discountValue: number;
    discountAmount: number;
  }[];
  // track if removed
  removed?: boolean;
}

const EditSalesPage = ({
  salesData,
  onBack,
  mutateSales,
}: EditSalesPageProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editablePaymentMethods, setEditablePaymentMethods] = useState<
    SalePayments[]
  >([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [clearSignal, setClearSignal] = useState(0);
  const handleClearCustomerComponent = () => {
    setClearSignal((prev) => prev + 1);
    setCustomerName(null);
  };
  // Editable header fields
  const [customerName, setCustomerName] = useState<{
    customerName: string;
    customerId: number | null;
  } | null>({
    customerName: salesData?.customerName ?? "",
    customerId: salesData?.customerId || null,
  });
  const [salesStatus, setSalesStatus] = useState(salesData?.salesStatus ?? "");
  const [salesNote, setSalesNote] = useState(salesData?.salesRemarks ?? "");

  // Editable items
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);

  const { data: response, isLoading } = useSWR<
    ApiResponse<DisplaySalesItems[]>
  >(
    salesData?.salesId
      ? `/api/sales/${salesData.storeId}/${salesData.salesId}/sales-items`
      : null,
    fetcher,
  );
  const { data: paymentMethodResponse = { data: [] } } = useSWR<{
    data: PaymentMethods[];
  }>(
    salesData ? `/api/payment-method/store/${salesData.storeId}/` : null,
    fetcher,
  );
  const paymentMethodOptions: DropdownOption[] = paymentMethodResponse.data.map(
    (p) => ({ label: p.payMetName, value: p.payMetId }),
  );
  useEffect(() => {
    if (response?.data) {
      setSalesNote(salesData?.salesRemarks || "");
      setEditableItems(
        response.data.map((item) => ({
          salesItemId: item.salesItemId,
          prodName: item.prodName ?? "",
          prodVarName: item.prodVarName ?? "",
          salesItemPrice: item.salesItemPrice,
          salesItemQuantity: item.salesItemQuantity,
          salesItemSubtotal: item.salesItemSubtotal,
          salesItemTotal: item.salesItemTotal,
          salesItemsDiscount: item.salesItemsDiscount ?? [],
        })),
      );
    }
  }, [response]);

  useEffect(() => {
    if (salesData) {
      setEditablePaymentMethods(
        salesData.paymentMethods.map((py) => ({
          payMetId: py.payMetId,
          paymentReference: py.paymentReference,
          salesPaymentAmount: py.salesPaymentAmount,
          salesPaymentId: py.salesPaymentId,
          salesId: py.salesId,
          salesPaymentStatus: py.salesPaymentStatus,
          paymentDate: py.paymentDate,
        })),
      );
    }
  }, [salesData]);
  if (isLoading) return <LoaderComponent />;

  const activeItems = editableItems.filter((i) => !i.removed);
  const paymentChange = handleArrayItemChange(
    "salesPaymentId",
    editablePaymentMethods,
    setEditablePaymentMethods,
  );
  const recalcItem = (item: EditableItem): EditableItem => {
    const subtotal = item.salesItemPrice * item.salesItemQuantity;
    const totalDiscount = item.salesItemsDiscount.reduce(
      (sum, d) => sum + (d.discountAmount ?? 0),
      0,
    );
    return {
      ...item,
      salesItemSubtotal: subtotal,
      salesItemTotal: subtotal - totalDiscount,
    };
  };
  const getEditedPayments = () => {
    if (!salesData?.paymentMethods) return [];

    return editablePaymentMethods.filter((edited) => {
      const original = salesData.paymentMethods.find(
        (p) => p.salesPaymentId === edited.salesPaymentId,
      );

      if (!original) return true; // new row case

      return (
        original.payMetId !== edited.payMetId ||
        original.paymentReference !== edited.paymentReference ||
        original.salesPaymentAmount !== edited.salesPaymentAmount ||
        original.salesPaymentStatus !== edited.salesPaymentStatus
      );
    });
  };
  const handleItemChange = (
    id: string | number,
    field: "salesItemPrice" | "salesItemQuantity",
    value: number,
  ) => {
    setEditableItems((prev) =>
      prev.map((item) =>
        item.salesItemId === id
          ? recalcItem({ ...item, [field]: value })
          : item,
      ),
    );
  };

  const handleRemoveItem = (id: string | number) => {
    setEditableItems((prev) =>
      prev.map((item) =>
        item.salesItemId === id ? { ...item, removed: true } : item,
      ),
    );
  };

  const handleRestoreItem = (id: string | number) => {
    setEditableItems((prev) =>
      prev.map((item) =>
        item.salesItemId === id ? { ...item, removed: false } : item,
      ),
    );
  };

  const computedSubtotal = activeItems.reduce(
    (sum, i) => sum + i.salesItemSubtotal,
    0,
  );

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const salePayments = getEditedPayments();
      const updateSales: Partial<Sales> = {
        salesId: salesData?.salesId,
        customerId: customerName?.customerId || null,
        salesRemarks: salesNote || "",
        storeId: salesData?.storeId,
        salePayments: salePayments,
      };

      const res = await fetch(
        `/api/sales/${salesData?.storeId}/${salesData?.salesId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateSales),
        },
      );
      const result = await res.json();
      if (!result.success) {
        const err = await res.json();
        throw new Error(err?.message ?? "Failed to save changes.");
      }

      setSaveSuccess(true);
      mutateSales();
      toast.success("Changes saved successfully.");
      onBack();
    } catch (err: any) {
      console.log({ err });
      setSaveError(err.message ?? "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  };
  const searchCustomers = async (query: string): Promise<Customer[]> => {
    const res = await fetch(
      `/api/customers/store/${salesData?.storeId}?search=${encodeURIComponent(query)}`,
    );
    const json = await res.json();
    return json.data || [];
  };
  return (
    <div className="min-h-screen overflow-auto-y">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2 2xl:mb-4 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Sale
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 2xl:p-6 mb-2 2xl:mb-4">
          <div className="flex justify-between items-center mb-3 2xl:mb-6">
            <div>
              <h1 className="text-sm 2xl:text-2xl font-semibold text-gray-900 mb-1">
                Edit Sale
              </h1>
              <p className="text-xs 2xl:text-sm text-gray-500">
                {salesData?.salesInvoice} · Order #{salesData?.salesNo}
              </p>
            </div>
          </div>

          {/* Feedback */}
          {saveError && (
            <div className="mb-2 2xl:mb-4 text-xs 2xl:text-sm text-red-600 bg-red-50 border border-red-200 rounded px-4 py-2">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="mb-2 2xl:mb-4 text-xs 2xl:text-sm text-green-700 bg-green-50 border border-green-200 rounded px-4 py-2">
              Changes saved successfully.
            </div>
          )}

          {/* Editable Fields */}
          <div className="grid grid-cols-3 gap-3 2xl:gap-6 pt-2 2xl:pt-4 border-t border-gray-200">
            <div>
              <DropdownSearch<Customer>
                sizes="xs"
                label="Customer"
                placeholder={
                  customerName ? customerName.customerName : "Walk in"
                }
                searchFn={searchCustomers}
                onSelect={function (row: Customer): void {
                  if (row) {
                    setCustomerName({
                      customerName: row.customerName,
                      customerId: row.customerId,
                    });
                  } else {
                    setCustomerName({
                      customerName: "",
                      customerId: null,
                    });
                  }
                }}
                renderItem={(customer: Customer) => (
                  <span>{customer.customerName}</span>
                )}
                displayValue={(customer: Customer) => customer.customerName}
                clearSignal={clearSignal}
              />
              {/* <label className="text-xs text-gray-500 mb-1 block">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer"
                className="w-full text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
              /> */}
            </div>
            <div>
              <DropdownSelect
                name={"salesStatus"}
                label="Status"
                value={salesStatus}
                options={[
                  { label: "Completed", value: "completed" },
                  { label: "Pending", value: "pending" },
                  { label: "Voided", value: "voided" },
                  { label: "Refunded", value: "refunded" },
                ]}
                sizes="xs"
                onChange={(e) => setSalesStatus(e.target.value)}
              />
            </div>
            <div>
              <Input
                sizes="xs"
                label="Note"
                value={salesNote}
                name="salesNote"
                onChange={(e) => setSalesNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Items Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 2xl:p-6 mb-2 2xl:mb-4">
          <h2 className="text-sm 2xl:text-2xl font-semibold text-gray-900 mb-2 2xl:mb-4">
            Items ({activeItems.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-[9px] 2xl:text-xs font-medium text-gray-500 uppercase tracking-widerpb-1.5 2xl:pb-3">
                    Description
                  </th>
                  <th className="text-right text-[9px] 2xl:text-xs font-medium text-gray-500 uppercase tracking-widerpb-1.5 2xl:pb-3">
                    Price
                  </th>
                  <th className="text-center text-[9px] 2xl:text-xs font-medium text-gray-500 uppercase tracking-widerpb-1.5 2xl:pb-3">
                    Qty
                  </th>
                  <th className="text-right text-[9px] 2xl:text-xs font-medium text-gray-500 uppercase tracking-widerpb-1.5 2xl:pb-3">
                    Subtotal
                  </th>
                  <th className="text-right text-[9px] 2xl:text-xs font-medium text-gray-500 uppercase tracking-widerpb-1.5 2xl:pb-3">
                    Discount
                  </th>
                  <th className="text-right text-[9px] 2xl:text-xs font-medium text-gray-500 uppercase tracking-widerpb-1.5 2xl:pb-3">
                    Total
                  </th>
                  <th className="pb-1.5 2xl:pb-3" />
                </tr>
              </thead>
              <tbody>
                {editableItems.map((item, index) => {
                  const modifyName = (item.prodVarName ?? "")
                    .toLowerCase()
                    .includes((item.prodName ?? "").toLowerCase())
                    ? item.prodVarName
                    : `${item.prodName ?? ""} ${item.prodVarName ?? ""}`.trim();

                  const isLast = index !== editableItems.length - 1;

                  if (item.removed) {
                    return (
                      <tr
                        key={item.salesItemId}
                        className={`${isLast ? "border-b border-gray-100" : ""} bg-red-50 opacity-60`}
                      >
                        <td className="py-2 text-xs 2xl:text-sm text-gray-400 line-through">
                          {modifyName}
                        </td>
                        <td className="py-2 text-xs 2xl:text-sm text-gray-400 line-through">
                          {formatPeso(item.salesItemPrice)}
                        </td>
                        <td className="py-2 text-center text-xs 2xl:text-sm text-gray-400 line-through">
                          {item.salesItemQuantity}
                        </td>
                        <td className="py-2 text-right text-xs 2xl:text-sm text-gray-400 line-through">
                          {formatPeso(item.salesItemSubtotal)}
                        </td>
                        <td className="py-2 text-right text-xs 2xl:text-sm text-gray-400">
                          —
                        </td>
                        <td className="py-2 text-right text-xs 2xl:text-sm text-gray-400 line-through">
                          {formatPeso(item.salesItemTotal)}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => handleRestoreItem(item.salesItemId)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Restore
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={item.salesItemId}
                      className={isLast ? "border-b border-gray-100" : ""}
                    >
                      <td className="py-2">
                        <div className="text-xs 2xl:text-sm font-medium text-gray-900">
                          {modifyName}
                        </div>
                        <div className="text-[9px] 2xl:text-xs text-gray-500">
                          {item.prodName}
                        </div>
                      </td>
                      <td className="py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.salesItemPrice}
                          onChange={(e) =>
                            handleItemChange(
                              item.salesItemId,
                              "salesItemPrice",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-20 2xl:w-24 text-xs 2xl:text-sm text-right border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        />
                      </td>
                      <td className="py-2 text-center">
                        <input
                          type="number"
                          min={1}
                          step="1"
                          value={item.salesItemQuantity}
                          onChange={(e) =>
                            handleItemChange(
                              item.salesItemId,
                              "salesItemQuantity",
                              parseInt(e.target.value) || 1,
                            )
                          }
                          className="w-12 2xl:w-16 text-xs 2xl:text-sm text-center border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        />
                      </td>
                      <td className="py-2 text-right text-xs 2xl:text-sm text-gray-900">
                        {formatPeso(item.salesItemSubtotal)}
                      </td>
                      <td className="py-2 text-right text-xs 2xl:text-sm text-gray-700">
                        {item.salesItemsDiscount?.map((dis, i) => {
                          const formatDiscount =
                            dis.discountType === "percent"
                              ? `${formatDiscountValue(dis.discountValue)}%`
                              : `${formatPeso(dis.discountValue)}`;
                          return (
                            <div key={i}>
                              {formatDiscount} ({formatPeso(dis.discountAmount)}
                              )
                            </div>
                          );
                        })}
                      </td>
                      <td className="py-2 text-right text-xs 2xl:text-sm font-medium text-gray-900">
                        {formatPeso(item.salesItemTotal)}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => handleRemoveItem(item.salesItemId)}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-gray-200 w-full">
            <div className="flex justify-between mb-2">
              <div className="text-xs 2xl:text-sm text-gray-600">Subtotal</div>
              <div className="text-xs 2xl:text-sm text-gray-900">
                {formatPeso(computedSubtotal)}
              </div>
            </div>

            {salesData?.salesDiscounts &&
              salesData.salesDiscounts.length > 0 && (
                <div className="flex justify-between mb-3">
                  <div className="text-xs 2xl:text-sm text-gray-600">
                    Discounts
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {salesData.salesDiscounts.map((disc) => (
                      <div
                        key={disc.salesDiscountId}
                        className="flex justify-between w-full text-xs 2xl:text-sm text-gray-500"
                      >
                        <span className="truncate text-right">
                          {disc.discountName}{" "}
                          {disc.discountType === "percent"
                            ? `(${disc.discountValue}%)`
                            : `₱${disc.discountValue.toFixed(2)}`}
                        </span>
                        <span className="text-red-600 font-semibold ml-2">
                          - {formatPeso(disc.discountAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="flex justify-between pt-3 border-t border-gray-200">
              <div className=" text-sm 2xl:text-base font-semibold text-gray-900">
                Total
              </div>
              <div className="text-sm 2xl:text-base font-semibold text-gray-900">
                {formatPeso(salesData?.salesTotalAmount)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3 2xl:p-6 mb-2 2xl:mb-4 w-full">
          <h2 className="text-sm 2xl:text-2xl font-semibold text-gray-900 mb-2 2xl:mb-4">
            Payment Methods
          </h2>
          {/* Summary Section */}
          <div className=" pt-2 2xl:pt-4 mt-4 border-t border-gray-200 space-y-2">
            <div className="flex justify-between items-center">
              <div className="text-xs 2xl:text-sm font-medium text-gray-900">
                Amount Due
              </div>
              <div className="text-xs 2xl:text-base font-semibold text-gray-900">
                {formatPeso(salesData?.salesTotalAmount ?? 0)}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-xs 2xl:text-sm text-gray-600">
                Total Paid
              </div>
              <div className="text-xs 2xl:text-sm text-gray-900">
                {formatPeso(salesData?.salesTotalPaid ?? 0)}
              </div>
            </div>

            {Number(salesData?.salesTotalPaid) >
              Number(salesData?.salesTotalAmount) && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <div className="text-xs 2xl:text-sm text-gray-600">Change</div>
                <div className="text-xs 2xl:text-sm font-medium text-green-600">
                  {formatPeso(
                    Number(salesData?.salesTotalPaid ?? 0) -
                      Number(salesData?.salesTotalAmount ?? 0),
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payment Methods Details */}
          {editablePaymentMethods && editablePaymentMethods.length > 0 && (
            <div className="mt-2 2xl:mt-4 pt-2 2xl:pt-4 border-t border-gray-200 space-y-2">
              <h3 className="text-xs 2xl:text-sm font-medium text-gray-900 mb-2">
                Payment Details
              </h3>
              {editablePaymentMethods.map((pay) => {
                const findMethods = paymentMethodResponse.data.find(
                  (pm) => Number(pm.payMetId) === Number(pay.payMetId),
                );
                return (
                  <div
                    key={pay.salesPaymentId}
                    className="flex justify-between items-center text-sm text-gray-700 px-1 py-1 bg-gray-50 rounded"
                  >
                    <div className="flex  gap-2">
                      <DropdownSelect
                        label="Method"
                        name={"payMetId"}
                        value={String(pay.payMetId) ?? undefined}
                        options={paymentMethodOptions}
                        sizes="xs"
                        onChange={(e) => {
                          paymentChange(pay.salesPaymentId, e);
                        }}
                      />
                      {Boolean(findMethods?.payMetHasRef) && (
                        <span className="text-gray-500 text-xs truncate">
                          Ref:{" "}
                          <Input
                            label={""}
                            sizes={"xs"}
                            name="paymentReference"
                            value={pay.paymentReference}
                            onChange={(e) => {
                              paymentChange(pay.salesPaymentId, e);
                            }}
                          />
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-gray-900">
                      {formatPeso(pay.salesPaymentAmount)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Final Total Paid */}
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-900">Total Paid</div>
            <div className="text-base font-semibold text-gray-900">
              {formatPeso(salesData?.salesTotalPaid ?? 0)}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex justify-end gap-2 pb-8">
          <Button label="Cancel" color="outline" size="sm" onClick={onBack} />
          <Button
            label={isSaving ? "Saving..." : "Save Changes"}
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          />
        </div>
      </div>
    </div>
  );
};

export default EditSalesPage;
