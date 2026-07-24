import BigCard from "@/components/shared/BigCard";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Table, { Column } from "@/components/shared/Table";
import Textarea from "@/components/shared/TextArea";
import Toggle from "@/components/shared/Toggle";
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
} from "@/dtos/paymentMethods.dto";
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
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<UpdatePaymentMethodDto | null>(
    null,
  );
  const [paymentMethodForm, setPaymentMethodForm] =
    useState<CreatePaymentMethodDto>({
      payMetCreatedBy: 0,
      payMetName: "",
      storeId: 0,
      payMetHasRef: 0,
      payMetDesc: "",
      payMetIsEmail: false,
      payMetIsOnline: false,
      payMetIsCustomer: false,
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
      payMetIsEmail: false,
      payMetIsOnline: false,
      payMetIsCustomer: false,
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
        throw new Error(res.message);
      }
      mutate();
      handleClearForm();
      toast.success(res.message);
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  const handleSelectPaymentMethod = (row: PaymentMethods) => {
    setSelectedPaymentMethhod(row);
    setEditForm({
      payMetId: row.payMetId,
      payMetName: row.payMetName,
      payMetDesc: row.payMetDesc,
      payMetHasRef: row.payMetHasRef,
      payMetIsEmail: row.payMetIsEmail,
      payMetIsOnline: row.payMetIsOnline,
      payMetIsCustomer: row.payMetIsCustomer,
    });
  };

  const handleSavePaymentMethod = async () => {
    if (!editForm) return;

    setIsSaving(true);
    try {
      const result = await fetch(`/api/payment-method/${editForm.payMetId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success(res.message);
      mutate();
      setSelectedPaymentMethhod(null);
      setEditForm(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {!selectedPaymentMethod ? (
        <>
          <BigCard title="Create Payment Method" isRounded={false}>
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Payment Method Name"
                  sizes="xs"
                  value={paymentMethodForm.payMetName}
                  name="payMetName"
                  onChange={handlePaymentMethodChange}
                  disabled={isAdding}
                />

                <Textarea
                  label="Description"
                  sizes="xs"
                  value={paymentMethodForm.payMetDesc}
                  name="payMetDesc"
                  onChange={handlePaymentMethodChange}
                  disabled={isAdding}
                />

                <div className="rounded-md border border-gray-200 p-3">
                  <Toggle
                    label="Require Reference Number"
                    sizes="xs"
                    initial={paymentMethodForm.payMetHasRef === 1}
                    onToggle={(state) => {
                      setPaymentMethodForm((prev) => ({
                        ...prev,
                        payMetHasRef: state ? 1 : 0,
                      }));
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Turn this on if this payment method needs a reference
                    number.
                  </p>
                </div>

                <div className="rounded-md border border-gray-200 p-3">
                  <Toggle
                    label="Send Email Notification"
                    sizes="xs"
                    initial={paymentMethodForm.payMetIsEmail}
                    onToggle={(state) => {
                      setPaymentMethodForm((prev) => ({
                        ...prev,
                        payMetIsEmail: state,
                      }));
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Automatically send an email when this payment method is
                    used.
                  </p>
                </div>

                <div className="rounded-md border border-gray-200 p-3">
                  <Toggle
                    label="Show in Online Store"
                    sizes="xs"
                    initial={paymentMethodForm.payMetIsOnline ?? false}
                    onToggle={(state) => {
                      setPaymentMethodForm((prev) => ({
                        ...prev,
                        payMetIsOnline: state,
                      }));
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Make this payment method selectable by customers on the
                    online store.
                  </p>
                </div>

                <div className="rounded-md border border-gray-200 p-3">
                  <Toggle
                    label="Requires Customer"
                    sizes="xs"
                    initial={paymentMethodForm.payMetIsCustomer ?? false}
                    onToggle={(state) => {
                      setPaymentMethodForm((prev) => ({
                        ...prev,
                        payMetIsCustomer: state,
                      }));
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Require a customer to be selected in POS before this
                    payment method can be used.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <Button
                  label="Clear"
                  size="xs"
                  color="secondary"
                  hasBorder
                  onClick={handleClearForm}
                  disabled={isAdding}
                />
                <Button
                  label="Create Payment Method"
                  size="xs"
                  color="primary"
                  hasBorder
                  onClick={handleCreatePaymentMethod}
                  loading={isAdding}
                />
              </div>
            </div>
          </BigCard>

          <BigCard title="Payment Methods" isRounded={false}>
            <Table
              columns={paymentMethodColumns}
              data={itemResponse.data}
              loading={loading}
              onRowSelection={handleSelectPaymentMethod}
            />
          </BigCard>
        </>
      ) : (
        <BigCard title="Payment Method Details" isRounded={false}>
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Payment Method Name"
                sizes="xs"
                value={editForm?.payMetName ?? ""}
                name="payMetName"
                onChange={(e) =>
                  setEditForm((prev) =>
                    prev ? { ...prev, payMetName: e.target.value } : prev,
                  )
                }
                disabled={isSaving}
              />

              <Textarea
                label="Description"
                sizes="xs"
                value={editForm?.payMetDesc ?? ""}
                name="payMetDesc"
                onChange={(e) =>
                  setEditForm((prev) =>
                    prev ? { ...prev, payMetDesc: e.target.value } : prev,
                  )
                }
                disabled={isSaving}
              />

              <div className="rounded-md border border-gray-200 p-3">
                <Toggle
                  label="Require Reference Number"
                  sizes="xs"
                  initial={editForm?.payMetHasRef === 1}
                  onToggle={(state) => {
                    setEditForm((prev) =>
                      prev ? { ...prev, payMetHasRef: state ? 1 : 0 } : prev,
                    );
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Turn this on if this payment method needs a reference
                  number.
                </p>
              </div>

              <div className="rounded-md border border-gray-200 p-3">
                <Toggle
                  label="Send Email Notification"
                  sizes="xs"
                  initial={editForm?.payMetIsEmail ?? false}
                  onToggle={(state) => {
                    setEditForm((prev) =>
                      prev ? { ...prev, payMetIsEmail: state } : prev,
                    );
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Automatically send an email when this payment method is
                  used.
                </p>
              </div>

              <div className="rounded-md border border-gray-200 p-3">
                <Toggle
                  label="Show in Online Store"
                  sizes="xs"
                  initial={editForm?.payMetIsOnline ?? false}
                  onToggle={(state) => {
                    setEditForm((prev) =>
                      prev ? { ...prev, payMetIsOnline: state } : prev,
                    );
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Make this payment method selectable by customers on the
                  online store.
                </p>
              </div>

              <div className="rounded-md border border-gray-200 p-3">
                <Toggle
                  label="Requires Customer"
                  sizes="xs"
                  initial={editForm?.payMetIsCustomer ?? false}
                  onToggle={(state) => {
                    setEditForm((prev) =>
                      prev ? { ...prev, payMetIsCustomer: state } : prev,
                    );
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Require a customer to be selected in POS before this
                  payment method can be used.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DetailItem label="Created At">
                {formatDateToWords(selectedPaymentMethod.payMetCreatedAt)}
              </DetailItem>

              <DetailItem label="Updated At">
                {formatDateToWords(selectedPaymentMethod.payMetUpdatedAt)}
              </DetailItem>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button
                label="Back"
                color="secondary"
                size="xs"
                disabled={isSaving}
                onClick={() => {
                  setSelectedPaymentMethhod(null);
                  setEditForm(null);
                }}
              />
              <Button
                label="Save Changes"
                color="primary"
                size="xs"
                loading={isSaving}
                onClick={handleSavePaymentMethod}
              />
            </div>
          </div>
        </BigCard>
      )}
    </div>
  );
};

export default PaymentMethodList;

const DetailItem = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-md border border-gray-200 p-3">
    <span className="text-xs text-gray-500">{label}</span>
    <p className="mt-1 text-sm font-semibold">{children}</p>
  </div>
);
