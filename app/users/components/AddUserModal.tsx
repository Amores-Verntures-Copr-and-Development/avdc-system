import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";
import DropDownSelectCompany from "@/components/shared/DropDownSelectCompany";
import Input from "@/components/shared/Input";
import SectionHeader from "@/components/shared/SectionHeader";
import Table, { Column } from "@/components/shared/Table";
import { positionOptions, roleOptions } from "@/constants/dropdown-options";
import { CreateUserDto } from "@/dtos/user.dto";
import { UserAuth } from "@/hooks/useSession";
import { Companies } from "@/types/company";
import { StoreInterface } from "@/types/stores";
import { fetcher } from "@/utils/fetcher";
import { handleChange } from "@/utils/handle-change";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Briefcase,
  Building2,
  Check,
  ClipboardCheck,
  Lock,
  LucideIcon,
  Mail,
  ShieldCheck,
  Store,
  User as UserIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

interface AddUserModalProps {
  onSubmit: (data: CreateUserDto) => Promise<boolean>;
  onCancel: () => void;
  user?: UserAuth | null;
}

type ModalStep = 1 | 2 | 3; // 1: User Info, 2: Employee Info, 3: Review & Submit

const storeColumn: Column<StoreInterface>[] = [
  { name: "ID", key: "storeId" },
  { name: "Name", key: "storeName" },
  { name: "Location", key: "storeLocation" },
  { name: "Description", key: "storeDescription" },
];

const roleLabelMap: Record<string, string> = {
  superadmin: "Super Admin",
  owner: "Owner",
  employee: "Employee",
};

const ReviewItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start gap-2.5">
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-50">
      <Icon className="h-3.5 w-3.5 text-gray-400" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-gray-500">{label}</p>
      <div className="truncate text-sm font-medium text-gray-900">{value}</div>
    </div>
  </div>
);

const AddUserModal: React.FC<AddUserModalProps> = ({
  onCancel,
  onSubmit,
  user,
}) => {
  const userDefaultForm: CreateUserDto = {
    userEmail: "",
    userFname: "",
    userLname: "",
    userName: "",
    userPassword: "",
    userRole: null,
    userAddedBy: user?.userId ?? null,
    userMname: "",
    empPosition: null,
    storeId: null,
    storeEmployee: [],
    companyId: undefined,
  };

  const [addUserFormData, setAddUserFormData] =
    useState<CreateUserDto>(userDefaultForm);
  const [currentStep, setCurrentStep] = useState<ModalStep>(1);

  const handleFormChange = handleChange(addUserFormData, setAddUserFormData);

  const handleSubmit = async () => {
    // Combine assigned stores with form data
    const submitData: CreateUserDto = {
      ...addUserFormData,
      storeEmployee:
        selectedStores.map((store) => ({
          storeId: store.storeId ?? 0,
          empId: 0,
          storeEmpCreatedBy: user?.userId ?? 0,
        })) ?? [],
    };

    const success = await onSubmit(submitData);
    if (success) {
      onCancel();
    }
  };

  const { data: response = { data: [] } } = useSWR<{ data: StoreInterface[] }>(
    "/api/stores/",
    fetcher,
  );
  const [selectedStores, setSelectedStores] = useState<StoreInterface[]>([]);
  const handleSelectionChange = (selected: StoreInterface[]) => {
    setSelectedStores(selected);
  };

  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as ModalStep);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as ModalStep);
    }
  };

  const validateStep1 = () => {
    if (!addUserFormData.userRole) {
      toast.error("User role is required!");
      return false;
    }
    if (!addUserFormData.userFname?.trim()) {
      toast.error("First Name is required!");
      return false;
    }
    if (!addUserFormData.userLname?.trim()) {
      toast.error("Last Name is required!");
      return false;
    }
    if (!addUserFormData.userEmail?.trim()) {
      toast.error("Email is required!");
      return false;
    }
    if (!addUserFormData.userName?.trim()) {
      toast.error("Username is required!");
      return false;
    }
    if (!addUserFormData.userPassword?.trim()) {
      toast.error("Password is required!");
      return false;
    }
    if (addUserFormData.userRole === "owner" && !addUserFormData.companyId) {
      toast.error("Company is required for an Owner!");
      return false;
    }
    return true;
  };

  const isEmployee = addUserFormData.userRole === "employee";
  const isOwner = addUserFormData.userRole === "owner";
  const isSkippingEmployeeStep = !isEmployee;
  const isSuperAdmin = user?.userRole === "superadmin";

  // A superadmin isn't tied to one company, so they must pick which company
  // the new Owner belongs to. Everyone else already belongs to exactly one
  // company - the backend forces companyId to actingUser.companyId for them
  // regardless of what's submitted, so auto-connecting it here (instead of
  // showing an editable dropdown of every company in the system) keeps the
  // form honest about what will actually happen.
  useEffect(() => {
    if (isOwner && !isSuperAdmin && user?.companyId) {
      setAddUserFormData((prev) =>
        prev.companyId === user.companyId
          ? prev
          : { ...prev, companyId: user.companyId },
      );
    }
  }, [isOwner, isSuperAdmin, user?.companyId]);

  // Only an existing Super Admin can create another one - hide the option
  // entirely for everyone else rather than letting them pick it and get
  // rejected server-side.
  const visibleRoleOptions =
    user?.userRole === "superadmin"
      ? roleOptions
      : roleOptions.filter((option) => option.value !== "superadmin");

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setAddUserFormData({
      ...addUserFormData,
      companyId: value ? Number(value) : undefined,
    });
  };

  const { data: companiesResponse = { data: [] } } = useSWR<{
    data: Companies[];
  }>(isOwner && isSuperAdmin ? "/api/companies" : null, fetcher);
  const selectedCompanyName = isSuperAdmin
    ? companiesResponse.data.find(
        (c) => c.companyId === addUserFormData.companyId,
      )?.companyName
    : user?.companyName;

  // Step 1: User Information
  const renderUserInfoStep = () => (
    <div className="flex flex-col gap-5">
      <SectionHeader
        icon={UserIcon}
        title="User Information"
        subtitle="Basic account details for the new user."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          sizes="xs"
          value={addUserFormData.userFname}
          name="userFname"
          label="First Name"
          onChange={handleFormChange}
          leadingIcon={<UserIcon className="h-3.5 w-3.5" />}
          required
        />
        <Input
          sizes="xs"
          value={addUserFormData.userMname ?? ""}
          name="userMname"
          label="Middle Name (optional)"
          onChange={handleFormChange}
          leadingIcon={<UserIcon className="h-3.5 w-3.5" />}
        />
        <Input
          sizes="xs"
          value={addUserFormData.userLname ?? ""}
          name="userLname"
          label="Last Name"
          onChange={handleFormChange}
          leadingIcon={<UserIcon className="h-3.5 w-3.5" />}
          required
        />
        <Input
          sizes="xs"
          name="userEmail"
          value={addUserFormData.userEmail}
          label="Email"
          type="email"
          onChange={handleFormChange}
          leadingIcon={<Mail className="h-3.5 w-3.5" />}
          required
        />
        <Input
          sizes="xs"
          label="Username"
          value={addUserFormData.userName}
          name="userName"
          onChange={handleFormChange}
          leadingIcon={<AtSign className="h-3.5 w-3.5" />}
          required
        />
        <Input
          sizes="xs"
          label="Password"
          value={addUserFormData.userPassword}
          name="userPassword"
          type="password"
          onChange={handleFormChange}
          leadingIcon={<Lock className="h-3.5 w-3.5" />}
          required
        />
      </div>

      <div className="border-t border-gray-100 pt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DropdownSelect
            name="userRole"
            sizes="xs"
            label="Role"
            value={addUserFormData.userRole ?? ""}
            onChange={handleFormChange}
            options={visibleRoleOptions}
            required
          />
          {isOwner &&
            (isSuperAdmin ? (
              <DropDownSelectCompany
                name="companyId"
                sizes="xs"
                label="Company"
                value={
                  addUserFormData.companyId != null
                    ? String(addUserFormData.companyId)
                    : ""
                }
                onChange={handleCompanyChange}
                required
              />
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">
                  Company
                </span>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                  <Building2 className="h-3.5 w-3.5 text-gray-400" />
                  {user?.companyName ?? "Your company"}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  // Step 2: Employee Information (only shown if userRole is "employee")
  const renderEmployeeInfoStep = () => {
    const canAssignStores =
      addUserFormData.empPosition === "supervisor" ||
      addUserFormData.empPosition === "staff";

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <SectionHeader
            icon={Briefcase}
            title="Employee Information"
            subtitle="Define this employee's position within the organization."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DropdownSelect
              name="empPosition"
              sizes="xs"
              label="Position"
              value={addUserFormData.empPosition ?? ""}
              onChange={handleFormChange}
              options={positionOptions}
              required
            />
          </div>
        </div>

        {canAssignStores && (
          <div className="flex flex-col gap-3 border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between">
              <SectionHeader
                icon={Store}
                title="Assign Stores"
                subtitle="Select which store(s) this employee can access."
              />
              {selectedStores.length > 0 && (
                <span className="shrink-0 rounded-full bg-primary-1/10 px-2.5 py-1 text-[11px] font-semibold text-primary-1">
                  {selectedStores.length} selected
                </span>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200">
              <Table
                showCheckBox
                isRounded={false}
                columns={storeColumn}
                data={response.data}
                onSelectionChange={handleSelectionChange}
                uniqueIdKey="storeId"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Step 3: Review and Submit
  const renderReviewStep = () => (
    <div className="flex flex-col gap-5">
      <SectionHeader
        icon={ClipboardCheck}
        title="Review & Submit"
        subtitle="Double-check the details before creating this account."
      />

      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          <ReviewItem
            icon={UserIcon}
            label="Full Name"
            value={`${addUserFormData.userFname} ${addUserFormData.userLname}`.trim()}
          />
          <ReviewItem
            icon={Mail}
            label="Email"
            value={addUserFormData.userEmail || "-"}
          />
          <ReviewItem
            icon={AtSign}
            label="Username"
            value={addUserFormData.userName || "-"}
          />
          <ReviewItem
            icon={ShieldCheck}
            label="Role"
            value={
              <span className="inline-flex items-center rounded-full bg-primary-1/10 px-2.5 py-0.5 text-xs font-semibold text-primary-1">
                {roleLabelMap[addUserFormData.userRole ?? ""] ??
                  addUserFormData.userRole ??
                  "-"}
              </span>
            }
          />
        </div>

        {isOwner && (
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            <ReviewItem
              icon={Building2}
              label="Company"
              value={selectedCompanyName ?? "-"}
            />
          </div>
        )}

        {isEmployee && (
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            <ReviewItem
              icon={Briefcase}
              label="Position"
              value={
                positionOptions.find(
                  (o) => o.value === addUserFormData.empPosition,
                )?.label ??
                addUserFormData.empPosition ??
                "-"
              }
            />
            <ReviewItem
              icon={Store}
              label="Assigned Stores"
              value={`${selectedStores.length} store${
                selectedStores.length === 1 ? "" : "s"
              }`}
            />
          </div>
        )}

        {selectedStores.length > 0 && (
          <div className="flex flex-wrap gap-2 p-4">
            {selectedStores.map((store) => (
              <span
                key={store.storeId}
                className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700"
              >
                <Store className="h-3 w-3 text-gray-400" />
                {store.storeName}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderUserInfoStep();
      case 2:
        return renderEmployeeInfoStep();
      case 3:
        return renderReviewStep();
      default:
        return renderUserInfoStep();
    }
  };

  const steps: { step: ModalStep; label: string; icon: LucideIcon }[] = [
    { step: 1, label: "User Info", icon: UserIcon },
    {
      step: 2,
      label: isEmployee ? "Employee Info" : "Additional Info",
      icon: Briefcase,
    },
    { step: 3, label: "Review & Submit", icon: ClipboardCheck },
  ];

  // Step indicators
  const renderStepIndicators = () => (
    <div className="flex items-start">
      {steps.map((s, index) => {
        const isCompleted = currentStep > s.step;
        const isActive = currentStep === s.step;
        const Icon = s.icon;

        return (
          <React.Fragment key={s.step}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                  isCompleted
                    ? "border-primary-1 bg-primary-1 text-white"
                    : isActive
                      ? "border-primary-1 bg-white text-primary-1"
                      : "border-gray-200 bg-white text-gray-300"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={`text-center text-[11px] font-medium ${
                  isActive || isCompleted ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`mx-2 mb-5 h-0.5 flex-1 self-start rounded-full transition-colors ${
                  currentStep > s.step ? "bg-primary-1" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // Navigation buttons
  const renderNavigationButtons = () => {
    return (
      <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
        <div>
          {currentStep > 1 ? (
            <Button
              size="sm"
              className="text-sm font-semibold"
              color="secondary"
              icon={ArrowLeft}
              label="Back"
              onClick={() => {
                isSkippingEmployeeStep ? setCurrentStep(1) : goToPrevStep();
              }}
            />
          ) : (
            <Button
              size="sm"
              className="text-sm font-semibold"
              color="secondary"
              label="Cancel"
              onClick={onCancel}
            />
          )}
        </div>

        <div className="flex gap-2">
          {currentStep < 3 ? (
            <Button
              size="sm"
              label="Next"
              icon={ArrowRight}
              className="text-sm font-semibold"
              onClick={() => {
                const continueStep = validateStep1();

                if (!continueStep) {
                  return;
                }

                isSkippingEmployeeStep ? setCurrentStep(3) : goToNextStep();
              }}
            />
          ) : (
            <Button
              size="sm"
              label="Create User"
              icon={Check}
              className="text-sm font-semibold"
              onClick={handleSubmit}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {renderStepIndicators()}
      {renderCurrentStep()}
      {renderNavigationButtons()}
    </div>
  );
};

export default AddUserModal;
