import BigCard from "@/components/shared/BigCard";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Table, { Column } from "@/components/shared/Table";
import Textarea from "@/components/shared/TextArea";
import Toggle from "@/components/shared/Toggle";
import { CreatePaymentMethodDto } from "@/dtos/paymentMethods.dto";
import { UserAuth } from "@/hooks/useSession";
import { PaymentMethods } from "@/types/payment-methods";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

interface PaymentMethodListProps {
  storeId: number | null;
  user: UserAuth | null;
}

const paymentMethodColumns: Column<PaymentMethods>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  { key: "payMetName", name: "Name" },
];

const PaymentMethodList = ({ user, storeId }: PaymentMethodListProps) => {
  const [selectedPaymentMethod, setSelectedPaymentMethhod] =
    useState<PaymentMethods | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [paymentMethodForm, setPaymentMethodForm] =
    useState<CreatePaymentMethodDto>({
      payMetCreatedBy: 0,
      payMetName: "",
      storeId: 0,
      payMetHasRef: 0,
      payMetDesc: "",
    });
  const handlePaymentMethodChange = handleChange(
    paymentMethodForm,
    setPaymentMethodForm,
  );
  const {
    data: itemResponse = { data: [] },
    isLoading: loading,
    mutate,
  } = useSWR<{
    data: PaymentMethods[];
  }>(storeId ? `/api/payment-method/store/${storeId}/` : null, fetcher);
  const handleClearForm = () =>
    setPaymentMethodForm({
      payMetCreatedBy: 0,
      payMetName: "",
      storeId: 0,
      payMetHasRef: 0,
      payMetDesc: "",
    });

  const handleCreatePaymentMethod = async () => {
    if (!user || user.userId === 0) {
      toast.error("No user found!");
      return;
    }
    if (!storeId) {
      toast.error("No store found!");
      return;
    }
    if (paymentMethodForm.payMetName === "") {
      toast.error("No payment method name!");
      return;
    }
    const createPaymentMethodForm: CreatePaymentMethodDto = {
      ...paymentMethodForm,
      payMetCreatedBy: user?.userId,
      storeId: storeId,
    };

    setIsAdding(true);
    try {
      const result = await fetch(
        `/api/payment-method/store/${createPaymentMethodForm.storeId}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(createPaymentMethodForm),
        },
      );
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      mutate();
      // mutateStats();
      handleClearForm();
      toast.success(res.message);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {!selectedPaymentMethod ? (
        <div className="flex flex-col gap-2">
          <BigCard title={"Create Payment Method"} isRounded={false}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Input
                  label="Name"
                  sizes={"xs"}
                  value={paymentMethodForm.payMetName}
                  name="payMetName"
                  onChange={handlePaymentMethodChange}
                />
                <Textarea
                  label="Description"
                  sizes={"xs"}
                  value={paymentMethodForm.payMetDesc}
                  name="payMetDesc"
                  onChange={handlePaymentMethodChange}
                />
                <Toggle
                  label="Has Reference"
                  sizes={"xs"}
                  initial={paymentMethodForm.payMetHasRef === 1 ? true : false}
                  onToggle={(state) => {
                    setPaymentMethodForm((prev) => ({
                      ...prev,
                      payMetHasRef: state === true ? 1 : 0,
                    }));
                  }}
                />
              </div>
              <div className="flex mt-auto justify-end gap-4">
                <div>
                  <Button
                    label="Clear"
                    size="xs"
                    color="secondary"
                    hasBorder
                    onClick={handleClearForm}
                    disabled={isAdding}
                  />
                </div>
                <div>
                  <Button
                    label="Create"
                    size="xs"
                    color="primary"
                    hasBorder
                    onClick={handleCreatePaymentMethod}
                    loading={isAdding}
                  />
                </div>
              </div>
            </div>
          </BigCard>
          <BigCard title={"Payment Method List"} isRounded={false}>
            <div className="flex flex-col gap-2">
              <Table
                columns={paymentMethodColumns}
                data={itemResponse.data}
                loading={loading}
                onRowSelection={(row) => setSelectedPaymentMethhod(row)}
              />
            </div>
          </BigCard>
        </div>
      ) : (
        <BigCard title={selectedPaymentMethod.payMetName} isRounded={false}>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Name</span>
                <span className="text-sm font-semibold">
                  {selectedPaymentMethod.payMetName}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Name</span>
                <span className="text-sm font-semibold">
                  {selectedPaymentMethod.payMetName}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Has Reference?</span>
                <span className="text-sm font-semibold">
                  {selectedPaymentMethod.payMetHasRef === 1 ? "true" : "false"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Description</span>
                <span className="text-sm font-semibold">
                  {selectedPaymentMethod.payMetDesc || "-"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Updated</span>
                <span className="text-sm font-semibold">
                  {formatDateToWords(selectedPaymentMethod.payMetUpdatedAt)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Created At</span>
                <span className="text-sm font-semibold">
                  {formatDateToWords(selectedPaymentMethod.payMetCreatedAt)}
                </span>
              </div>
            </div>
            <div className="flex mt-auto justify-end gap-2">
              <div>
                {" "}
                <Button
                  label="Cancel"
                  color="secondary"
                  size="xs"
                  onClick={() => {
                    setSelectedPaymentMethhod(null);
                  }}
                />
              </div>
              <div>
                {" "}
                <Button label="Save" color="primary" size="xs" />
              </div>
            </div>
          </div>
        </BigCard>
      )}
    </div>
  );
};

export default PaymentMethodList;
