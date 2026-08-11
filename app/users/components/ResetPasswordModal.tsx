"use client";

import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface ResetPasswordModalProps {
  userId: number;
  userName: string;
  onClose: () => void;
}

const ResetPasswordModal = ({
  userId,
  userName,
  onClose,
}: ResetPasswordModalProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters!");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const json = await res.json();

      if (!json.success) {
        toast.error(json.message || "Failed to reset password");
        return;
      }

      toast.success("Password reset successfully!");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-gray-500">
        Set a new password for <span className="font-semibold">{userName}</span>.
        They&apos;ll need to use this new password the next time they log in.
      </p>

      <Input
        label="New Password"
        sizes="xs"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        disabled={isSubmitting}
      />

      <Input
        label="Confirm New Password"
        sizes="xs"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={isSubmitting}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button
          label="Cancel"
          size="xs"
          color="secondary"
          onClick={onClose}
          disabled={isSubmitting}
        />
        <Button
          label="Reset Password"
          size="xs"
          color="primary"
          hasBorder
          onClick={handleSubmit}
          loading={isSubmitting}
        />
      </div>
    </div>
  );
};

export default ResetPasswordModal;
