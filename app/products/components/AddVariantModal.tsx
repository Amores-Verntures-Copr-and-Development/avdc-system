import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { CreateProductVariantDto } from "@/dtos/products.dto";
import { handleChange } from "@/utils/handle-change";
import { ImageIcon, Upload } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface AddVariantModalProps {
  storeId: number;
  prodId: number;
  // Returns the newly created variant's prodVarId on success (so the image,
  // if any was picked, can be uploaded against it), or null on failure.
  onSubmit: (data: CreateProductVariantDto) => Promise<number | null>;
  mutate: () => void;
  isSubmitting: boolean;
}
const AddVariantModal = ({
  storeId,
  prodId,
  onSubmit,
  mutate,
  isSubmitting,
}: AddVariantModalProps) => {
  const [formData, setFormData] = useState<CreateProductVariantDto>({
    prodId: 0,
    prodVarCreatedBy: 0,
    prodVarName: "",
    prodVarPrice: 0,
    isDeductInv: false,
    inventoryItemId: null,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const handleDataChange = handleChange(formData, setFormData);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadVariantImage = async (prodVarId: number) => {
    if (!imageFile) return;
    setIsUploadingImage(true);
    try {
      const imageForm = new FormData();
      imageForm.append("image", imageFile);
      const result = await fetch(
        `/api/products/${storeId}/product-variants/${prodId}/${prodVarId}/image`,
        {
          method: "POST",
          body: imageForm,
          credentials: "include",
        },
      );
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
    } catch (e: any) {
      toast.error(e.message || "Variant was added, but the image failed to upload");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const resetForm = () => {
    setFormData({
      prodId: 0,
      prodVarCreatedBy: 0,
      prodVarName: "",
      prodVarPrice: 0,
      isDeductInv: false,
      inventoryItemId: null,
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleAddProduct = async () => {
    const newProdVarId = await onSubmit(formData);
    if (newProdVarId) {
      await uploadVariantImage(newProdVarId);
      if (mutate) {
        mutate();
        resetForm();
      }
    }
  };
  return (
    <div className="flex flex-col gap-2 w-full h-full">
      <span className="text-sm font-semibold"></span>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input
            label={"Name"}
            sizes={"sm"}
            onChange={handleDataChange}
            value={formData.prodVarName}
            name="prodVarName"
          />
          <Input
            label={"Price"}
            sizes={"sm"}
            onChange={handleDataChange}
            value={formData.prodVarPrice}
            name="prodVarPrice"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Variant preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-5 w-5 text-gray-300" />
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50">
            <Upload className="h-3.5 w-3.5" />
            {imageFile ? "Change Image" : "Upload Image"}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-auto">
        <Button
          label="Cancel"
          color="secondary"
          size="sm"
          className="font-semibold"
          disabled={isSubmitting}
        />
        <Button
          label="Add Variant"
          size="sm"
          className="font-semibold"
          onClick={handleAddProduct}
          loading={isSubmitting || isUploadingImage}
        />
      </div>
    </div>
  );
};

export default AddVariantModal;
