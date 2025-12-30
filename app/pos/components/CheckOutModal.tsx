import React, { useEffect, useState } from "react";
import { OrderList } from "../PosPage";
import { SalesDiscounts } from "@/types/sales-discounts";
import { formatPeso } from "@/utils/formatPeso";
import BigCard from "@/components/shared/BigCard";
import Button from "@/components/shared/Button";
import { PaymentMethods } from "@/types/payment-methods";
import IconButton from "@/components/shared/IconButton";
import {
  Banknote,
  CreditCard,
  PhilippinePeso,
  Plus,
  Tag,
  Trash,
  Wallet,
  X,
} from "lucide-react";
import { CreateSalePaymentDto } from "@/dtos/sales.dto";
import Input from "@/components/shared/Input";
import { CreatePaymentMethodDto } from "@/dtos/paymentMethods.dto";
import { createSalePayments } from "@/services/sales/sale-payments/create-sale-payments";
import { handleChange } from "@/utils/handle-change";

interface CheckOutModalProps {
  order: OrderList[] | null;
  discounts: SalesDiscounts[] | null;
  paymentMethods: PaymentMethods[] | null;
  selectedPaymentMethod: CreateSalePaymentDto[] | null;
  addPayment: (payment: CreateSalePaymentDto) => void;
  setSelectedPaymentMethod: React.Dispatch<
    React.SetStateAction<CreateSalePaymentDto[] | null>
  >;
}

const CheckOutModal = ({
  order,
  discounts,
  paymentMethods,
  selectedPaymentMethod,
  addPayment,
  setSelectedPaymentMethod,
}: CheckOutModalProps) => {
  const [selectedMethod, setSelectedMethod] =
    useState<CreateSalePaymentDto | null>({
      paymentReference: "",
      payMetId: 0,
      salesPaymentAmount: 0,
      salesId: 0,
    });
  const subtotal =
    order?.reduce((total, o) => total + o.prodVarPrice * o.quantity, 0) ?? 0;
  useEffect(() => {
    const defaultMethod = paymentMethods?.find(
      (pm) => pm.payMetName === "Cash"
    );
    if (defaultMethod) {
      // Check if already added
      const exists = selectedPaymentMethod?.some(
        (p) => p.payMetId === defaultMethod.payMetId
      );
      if (!exists) {
        setSelectedMethod((prev) => {
          if (!prev) {
            return {
              salesId: 0,
              payMetId: defaultMethod.payMetId,
              salesPaymentAmount: 0,
              paymentReference: "",
            };
          }

          return {
            ...prev,
            payMetId: defaultMethod.payMetId,
          };
        });
      }
    }
  }, []);

  const totalPaid = selectedPaymentMethod?.reduce(
    (sum, p) => sum + p.salesPaymentAmount,
    0
  );
  const remaining = Math.max(0, subtotal - (totalPaid || 0));
  const change = Math.max(0, (totalPaid || 0) - subtotal);

  const canComplete = (totalPaid || 0) >= subtotal;

  console.log({ totalPaid, remaining, change, canComplete });
  const updatePayment = (
    payMetId: number,
    field: "salesPaymentAmount" | "paymentReference",
    value: string | number
  ) => {
    setSelectedPaymentMethod(
      (prev) =>
        prev?.map((p) =>
          p.payMetId === payMetId ? { ...p, [field]: value } : p
        ) ?? []
    );
  };
  const quickAmounts = [5, 10, 20, 50, subtotal];
  const removePayment = (payMetId: number) => {
    setSelectedPaymentMethod((prev) =>
      prev ? prev.filter((p) => p.payMetId !== payMetId) : null
    );
  };
  const getPaymentIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "cash":
        return { color: "bg-green-500", icon: Banknote };
      case "bank":
      case "debit card":
        return { color: "bg-blue-500", icon: CreditCard };
      default:
        return { color: "bg-purple-500", icon: Wallet };
    }
  };
  const findPaymentMethod = paymentMethods?.find(
    (pm) => pm.payMetId === selectedMethod?.payMetId
  );
  const handleChangeSelectedPayment = handleChange(
    selectedMethod,
    setSelectedMethod
  );
  const handleAddPayment = () => {
    if (!selectedMethod) return;
    console.log({ selectedMethod });
    const paymentToAdd: CreateSalePaymentDto = {
      ...selectedMethod,
      salesPaymentAmount: Number(selectedMethod.salesPaymentAmount) || 0,
      salesId: 0,
    };
    addPayment(paymentToAdd);
    console.log({ selectedPaymentMethod });
    setSelectedMethod({
      paymentReference: "",
      payMetId: 0,
      salesId: 0,
      salesPaymentAmount: 0,
    });
  };
  return (
    <div className="flex flex-col h-full gap-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Total</p>
          <p className="font-bold text-slate-800">${subtotal.toFixed(2)}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <p className="text-xs text-emerald-600 mb-1">Paid</p>
          <p className="font-bold text-emerald-600">${totalPaid || 0}</p>
        </div>
        <div
          className={`rounded-xl p-4 text-center ${
            remaining > 0 ? "bg-amber-50" : "bg-emerald-50"
          }`}
        >
          <p
            className="text-xs mb-1"
            style={{ color: remaining > 0 ? "#d97706" : "#059669" }}
          >
            {remaining > 0 ? "Remaining" : "Change"}
          </p>
          <p
            className="font-bold"
            style={{ color: remaining > 0 ? "#d97706" : "#059669" }}
          >
            ${remaining > 0 ? remaining.toFixed(2) : change.toFixed(2)}
          </p>
        </div>
      </div>
      <div>
        <BigCard isRounded={true} title="Add Payments">
          {selectedPaymentMethod && selectedPaymentMethod.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {selectedPaymentMethod.map((payment, index) => {
                const method = paymentMethods?.find(
                  (m) => m.payMetId === payment.payMetId
                );
                const details = getPaymentIcon(method?.payMetName || "");
                const Icon = details.icon || Banknote;
                return (
                  <div
                    className="flex items-center justify-between bg-slate-50 rounded-lg p-3"
                    key={payment.payMetId}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${details.color} text-white`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-medium text-slate-800">
                          {method?.payMetName}
                        </span>
                        {payment.paymentReference && (
                          <p className="text-xs text-slate-500">
                            {payment.paymentReference}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">
                        ${payment.salesPaymentAmount.toFixed(2)}
                      </span>
                      <IconButton
                        bg="red"
                        icon={<X className="h-4 w-4" />}
                        label="Remove"
                        onClick={() => {}}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </BigCard>
      </div>
      <BigCard isRounded={true} title="Add Payments">
        <div className="flex flex-col divide-gray-200 overflow-auto  p-3 gap-3 h-full">
          <div className="grid grid-cols-4 gap-3">
            {paymentMethods?.map((payment) => {
              const { icon, color } = getPaymentIcon(payment.payMetName);
              const Icon = icon || Banknote;
              return (
                <button
                  key={payment.payMetId}
                  onClick={() =>
                    setSelectedMethod((prev) => {
                      if (!prev) {
                        return {
                          salesId: 0,
                          payMetId: payment.payMetId,
                          salesPaymentAmount: 0,
                          paymentReference: "",
                        };
                      }

                      return {
                        ...prev,
                        payMetId: payment.payMetId,
                      };
                    })
                  }
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    selectedMethod?.payMetId === payment.payMetId
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${color} text-white mb-2`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {payment.payMetName}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 flex-wrap">
            {quickAmounts.map((qa) => (
              <Button
                key={qa}
                color="secondary"
                size="sm"
                //   onClick={() => handleQuickAmount(qa)}
                className="flex-1"
                label={formatPeso(qa)}
              ></Button>
            ))}
            <Button
              color="warning"
              size="sm"
              // onClick={() => handleQuickAmount(subtotal)}
              className="flex-1 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
              label={`${formatPeso(subtotal)}`}
            ></Button>
          </div>
          <div className="flex flex-col gap-2">
            <Input
              leadingIcon={<PhilippinePeso className="w-4 h-4" />}
              label={""}
              sizes={"md"}
              type="number"
              name="salesPaymentAmount"
              value={Number(selectedMethod?.salesPaymentAmount) || ""}
              onChange={handleChangeSelectedPayment}
            />
            {findPaymentMethod?.payMetHasRef === 1 && (
              <Input
                label={""}
                placeholder="Reference (optional)"
                value={selectedMethod?.paymentReference}
                name="paymentReference"
                onChange={handleChangeSelectedPayment}
              />
            )}
          </div>

          <div className="mt-auto">
            <Button
              label="Add Payment"
              size={"md"}
              className="w-full"
              onClick={handleAddPayment}
              icon={<Plus className="w-4 h-4" />}
              disabled={!canComplete}
            />
          </div>
        </div>
      </BigCard>
    </div>
  );
};

export default CheckOutModal;
