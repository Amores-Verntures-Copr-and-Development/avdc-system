import BigCard from "@/components/shared/BigCard";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import {
  DisplaProductVariantsDtos,
  DisplayProductsDtos,
  DisplayVariantComponents,
} from "@/dtos/products.dto";
import { formatDateToWords } from "@/utils/formatDateToWords";
import React, { useState } from "react";
import AssignComponentModal from "./AssignComponentModal";
import IconButton from "@/components/shared/IconButton";
import { Pencil, Plus, Save, Trash, X } from "lucide-react";
import Input from "@/components/shared/Input";
import { ProductVariants } from "@/types/products";
import Toggle from "@/components/shared/Toggle";
import { handleChange } from "@/utils/handle-change";
import toast from "react-hot-toast";
import ViewVariantComponent from "./ViewVariantComponent";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import { useSession } from "@/hooks/useSession";
import { formatPeso } from "@/utils/formatPeso";

interface VariantComponentPageProps {
  data: DisplaProductVariantsDtos | null;
  showAddComponent: boolean;
  setShowAddComponent: React.Dispatch<React.SetStateAction<boolean>>;
  prod: DisplayProductsDtos | null;
  storeId: number;
  mutate: () => void;
  onClose: () => void;
}

const VariantComponentPage = ({
  data,

  setShowAddComponent: setShowComponent,
  prod,
  mutate,
  onClose,
  storeId,
}: VariantComponentPageProps) => {
  const { user, hasStore } = useSession();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteVariant, setShowDeleteVariant] =
    useState<DisplayVariantComponents | null>(null);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [selectedVariant, setSelectedVariant] =
    useState<DisplayVariantComponents | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState<ProductVariants>({
    prodId: data?.prodId ?? 0,
    prodVarCreatedAt: data?.prodVarCreatedAt ?? "",
    prodVarCreatedBy: data?.prodVarCreatedBy ?? 0,
    prodVarDeletedAt: data?.prodVarDeletedAt ?? "",
    prodVarId: data?.prodVarId ?? 0,
    prodVarName: data?.prodVarName ?? "",
    prodVarPrice: data?.prodVarPrice ?? 0,
    prodVarUpdatedAt: data?.prodVarUpdatedAt ?? "",
    prodVarUnit: data?.prodVarUnit,
    isDeductInv: Boolean(data?.isDeductInv),
    inventoryItemId: data?.inventoryItemId ?? null,
    isAvailableOnline: Boolean(data?.isAvailableOnline),
  });
  const handleFormChange = handleChange(form, setForm);
  const handleSave = async () => {
    setIsSaving(true);
    const variantForm: Partial<ProductVariants> = {
      prodVarId: Number(form.prodVarId),
      prodVarName: form.prodVarName,
      prodVarPrice: Number(form.prodVarPrice),
      isDeductInv: form.isDeductInv,
      isAvailableOnline: form.isAvailableOnline,
    };
    console.log({ variantForm });
    try {
      const result = await fetch(
        `/api/products/${storeId}/product-variants/${data?.prodId}/${data?.prodVarId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(variantForm),
          credentials: "include",
        },
      );

      const res = await result.json();

      if (!res.success) {
        throw new Error(res.err);
      }
      toast.success(res.message);
      setIsEdit(false);
      mutate();
      onClose();
    } catch (e) {
      console.log(e);
    } finally {
      setIsSaving(false);
    }
  };
  const totalCosting =
    data?.variantComponents?.reduce(
      (sum, item) => sum + Number(item.itemPrice) * item.quantityRequired,
      0,
    ) ?? 0;
  const handleDeleteVariantComponent = async () => {
    setIsDeleting(true);

    try {
      const result = await fetch(
        `/api/products/${storeId}/product-variants/${showDeleteVariant?.prodVarId}/${data?.prodVarId}/variant-component/${showDeleteVariant?.varComId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          method: "DELETE",
        },
      );
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success(res.message);
      mutate();
      setShowDeleteVariant(null);
      setShowComponent(false);
    } catch (e: any) {
      toast.error(e.error);
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <div className="flex flex-col gap-5">
      <BigCard
        title="Variant Details"
        isRounded={false}
        leftTitle={
          !isEdit ? (
            <div>
              <IconButton
                onClick={function (): void {
                  setIsEdit(true);
                }}
                label={"Edit Variant"}
                bg={"red"}
                icon={<Pencil className="w-4 h-4" />}
              />
            </div>
          ) : (
            <div className="flex gap-2">
              <div>
                <IconButton
                  onClick={function (): void {
                    setIsEdit(false);
                  }}
                  label={"Cancel"}
                  bg={"gray"}
                  icon={<X className="w-4 h-4" />}
                  disable={isSaving}
                />
              </div>
              <div>
                {/* <Button label="" icon={Save} color="success" size="xs"/> */}
                <IconButton
                  onClick={handleSave}
                  label={"Save"}
                  bg={"green"}
                  loading={isSaving}
                  icon={<Save className="w-4 h-4" />}
                />
              </div>
            </div>
          )
        }
      >
        {!isEdit ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailCard label="ID" value={data?.prodVarId} icon="#" />
            <DetailCard label="Name" value={data?.prodVarName} icon="▣" />
            <DetailCard
              label="Unit"
              value={data?.prodVarUnit || "-"}
              icon="□"
            />
            <DetailCard
              label="Price"
              value={`₱${Number(data?.prodVarPrice ?? 0).toLocaleString()}`}
              icon="₱"
            />

            <DetailCard
              label="Is Deduct"
              value={Boolean(data?.isDeductInv) ? "Yes" : "No"}
              icon="✓"
              badge={Boolean(data?.isDeductInv)}
            />

            <DetailCard
              label="Is Available Online"
              value={Boolean(data?.isAvailableOnline) ? "Yes" : "No"}
              icon="🌐"
              badge={Boolean(data?.isAvailableOnline)}
            />

            <DetailCard
              label="Updated At"
              value={formatDateToWords(data?.prodVarUpdatedAt || "")}
              icon="📅"
            />

            <DetailCard
              label="Created At"
              value={formatDateToWords(data?.prodVarCreatedAt || "")}
              icon="📅"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Top row: ID and Name */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                {/* <span className="text-xs text-gray-400 uppercase">ID</span>
                <span className="text-sm font-semibold text-gray-800">
                  {data?.prodVarId}
                </span> */}
                <Input
                  label={"Name"}
                  sizes={"xs"}
                  value={form.prodVarName}
                  onChange={handleFormChange}
                  name="prodVarName"
                />
              </div>
              <div className="flex flex-col">
                <Input
                  label={"Price"}
                  sizes={"xs"}
                  value={form.prodVarPrice}
                  onChange={handleFormChange}
                  name="prodVarPrice"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                {/* <span className="text-xs text-gray-400 uppercase">ID</span>
                <span className="text-sm font-semibold text-gray-800">
                  {data?.prodVarId}
                </span> */}
                <Input
                  label={"Unit"}
                  sizes={"xs"}
                  value={form.prodVarUnit ?? ""}
                  onChange={handleFormChange}
                  name="prodVarUnit"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Toggle
                sizes="xs"
                label="Is Deduct?"
                flexType="flex-col"
                initial={form.isDeductInv === true}
                onToggle={(state) =>
                  setForm((prev) => ({
                    ...prev,
                    isDeductInv: Boolean(state) === true ? true : false,
                  }))
                }
              />
              <div className="flex flex-col">
                <Toggle
                  sizes="xs"
                  label="Is Available Online?"
                  flexType="flex-col"
                  initial={form.isAvailableOnline === true}
                  onToggle={(state) =>
                    setForm((prev) => ({
                      ...prev,
                      isAvailableOnline: Boolean(state) === true ? true : false,
                    }))
                  }
                />
              </div>
            </div>

            {/* Bottom row: Price and Created At */}
          </div>
        )}
      </BigCard>
      <BigCard
        title={"Components"}
        subtitle="Manage the ingredients or items that make up this product"
        isRounded={false}
        leftTitle={
          <div className="h-full">
            <Button
              label="Assign "
              size="sm"
              icon={Plus}
              onClick={() => {
                setShowAddComponent(true);
                setShowComponent(true);
              }}
            />
          </div>
        }
      >
        {data?.variantComponents && data?.variantComponents.length > 0 ? (
          <div className="mt-4">
            <div className="flex justify-between">
              {" "}
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Components
              </span>
              <span className="text-xs 2xl:text-sm font-semibold">
                {formatPeso(totalCosting)}{" "}
                <span className="font-normal">cost price</span>
              </span>
            </div>
            <ul className="mt-2 divide-y divide-gray-200 rounded-md border border-gray-100 overflow-hidden">
              {data.variantComponents.map((comp) => (
                <li
                  key={comp.varComId}
                  onClick={() => {
                    setSelectedVariant(comp);
                    setShowComponent(true);
                  }}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-white hover:bg-gray-50 transition"
                >
                  <div className="flex flex-col sm:flex-col sm:items-start gap-2">
                    <span className="text-[10px] 2xl:text-xs font-medium text-gray-800">
                      {comp.itemName}
                    </span>
                    <span className="text-gray-500 text-[9px]  2xl:text-xs">
                      {comp.quantityRequired} qty (
                      {formatPeso(comp.quantityRequired * comp.itemPrice)})
                    </span>
                  </div>

                  <div className="mt-2 sm:mt-0 text-[9px] 2xl:text-xs font-medium">
                    Deduct:{" "}
                    <span
                      className={`${
                        Boolean(comp.isDeductVar)
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {Boolean(comp.isDeductVar) ? "Yes" : "No"}
                    </span>
                  </div>
                  <IconButton
                    onClick={function (): void {
                      setShowDeleteVariant(comp);
                      setShowComponent(true);
                    }}
                    icon={<Trash className="w-3 h-3" />}
                    label={"Delete Variant"}
                    bg={"red"}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-4 text-center text-gray-400">
            No components available!
          </div>
        )}
      </BigCard>
      <Modal
        size="lg"
        className="min-h-[50%]"
        title="Assign Component"
        isOpen={showAddComponent}
        onClose={function (): void {
          setShowAddComponent(false);
          setShowComponent(false);
        }}
      >
        <AssignComponentModal
          storeId={prod?.storeId ?? 0}
          prodId={prod?.prodId ?? 0}
          prodVarId={data?.prodVarId ?? 0}
          onClose={function (): void {
            setShowAddComponent(false);
            setShowComponent(false);
          }}
          mutate={mutate}
        />
      </Modal>
      <Modal
        size="lg"
        className=""
        title="Variant Component"
        isOpen={selectedVariant !== null}
        onClose={function (): void {
          setSelectedVariant(null);
          setShowComponent(false);
        }}
      >
        <ViewVariantComponent
          storeId={prod?.storeId ?? 0}
          prodId={prod?.prodId ?? 0}
          data={selectedVariant}
          onClose={() => {
            setSelectedVariant(null);
            setShowComponent(false);
          }}
          mutate={mutate}
        />
      </Modal>
      <ConfirmationModal
        onConfirm={function (): void {
          handleDeleteVariantComponent();
        }}
        confirmationInfo={`Are you sure you want to delete ${showDeleteVariant?.itemName} as variant component?`}
        onClose={function (): void {
          setShowDeleteVariant(null);
          setShowComponent(false);
        }}
        isShow={showDeleteVariant !== null}
        confirmLabel="Delete"
        title="Delete Variant Component"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default VariantComponentPage;

const DetailCard = ({
  label,
  value,
  icon,
  badge = false,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  badge?: boolean;
}) => (
  <div className="flex items-center gap-2 2xl:gap-4 rounded-xl border border-gray-200 bg-white p-2 2xl:p-4 shadow-sm">
    <div className="flex 2xl:h-10 2xl:w-10 w-5 h-5 items-center justify-center rounded-xl bg-pink-50 text-pink-600 font-semibold">
      {icon}
    </div>

    <div className="flex flex-col">
      <span className="text-[11px] 2xl:text-xs font-medium text-gray-500">
        {label}
      </span>

      {badge ? (
        <span className="mt-1 w-fit rounded-full border border-green-200 bg-green-50 px-3 py-0.5 text-[11px]  2xl:text-xs font-medium text-green-700">
          {value}
        </span>
      ) : (
        <span className="text-xs 2xl:text-sm font-semibold text-gray-900">
          {value}
        </span>
      )}
    </div>
  </div>
);
