import Button from "@/components/shared/Button";
import PageLayout from "@/components/shared/PageLayout";
import { ArrowLeft, ShieldAlert } from "lucide-react";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  onBack?: () => void;
  backLabel?: string;
}

const AccessDenied = ({
  title = "Access denied",
  message = "You don't have access to this store's data.",
  onBack,
  backLabel = "Back",
}: AccessDeniedProps) => (
  <PageLayout className="p-2">
    <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-red-200 bg-red-50/40 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <div>
        <p className="text-base font-semibold text-gray-800">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-gray-500">{message}</p>
      </div>
      {onBack && (
        <Button
          size="sm"
          color="secondary"
          icon={ArrowLeft}
          label={backLabel}
          onClick={onBack}
        />
      )}
    </div>
  </PageLayout>
);

export default AccessDenied;
