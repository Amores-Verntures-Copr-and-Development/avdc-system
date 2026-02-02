import React from "react";
import Modal from "./Modal";
import Button from "./Button";

interface ConfirmationModalProps {
  onConfirm: () => void;
  confirmationInfo: string;
  onClose: () => void;
  confirmLabel?: string;
  isShow: boolean;
  isLoading?: boolean;
  title?: string;
}
const ConfirmationModal = ({
  onConfirm,
  onClose,
  confirmationInfo,
  confirmLabel = "Submit",
  isShow = false,
  isLoading = false,
  title = "Received Confirmation",
}: ConfirmationModalProps) => {
  return (
    <Modal
      isOpen={isShow}
      onClose={function (): void {
        onClose();
      }}
      title={title}
    >
      <div className="flex flex-col gap-5">
        <div className="items-center text-center text-sm font-semibold">
          {confirmationInfo}
        </div>
        <div className="flex mt-auto justify-end gap-4">
          <div>
            <Button
              label="Cancel"
              size="xs"
              color="secondary"
              onClick={onClose}
              disabled={isLoading}
            />
          </div>
          <div>
            <Button
              label={confirmLabel}
              size="xs"
              color="primary"
              loading={isLoading}
              onClick={onConfirm}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
