import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";
import Input from "@/components/shared/Input";
import Table, { Column } from "@/components/shared/Table";
import { positionOptions, roleOptions } from "@/constants/dropdown-options";
import { CreateUserDto } from "@/dtos/user.dto";
import { UserAuth } from "@/hooks/useSession";
import { StoreInterface } from "@/types/stores";
import { fetcher } from "@/utils/fetcher";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
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
    // 👉 Here you can trigger bulk delete, bulk approve, etc.
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
    return true;
  };

  // Step 1: User Information
  const renderUserInfoStep = () => (
    <div className="space-y-5">
      <div className="space-y-3">
        <h1 className="text-md font-semibold mb-3">User Information</h1>
        <div className="flex flex-wrap gap-4">
          <Input
            sizes={"xs"}
            value={addUserFormData.userFname}
            name="userFname"
            label={"First Name"}
            onChange={handleFormChange}
            required
          />
          <Input
            sizes={"xs"}
            value={addUserFormData.userMname ?? ""}
            name="userMname"
            label={"Middle Name (optional)"}
            onChange={handleFormChange}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <Input
            sizes={"xs"}
            value={addUserFormData.userLname ?? ""}
            name="userLname"
            label={"Last Name"}
            onChange={handleFormChange}
            required
          />
          <Input
            sizes={"xs"}
            name="userEmail"
            value={addUserFormData.userEmail}
            label={"Email"}
            type="email"
            onChange={handleFormChange}
            required
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <Input
            sizes={"xs"}
            label={"Username"}
            value={addUserFormData.userName}
            name="userName"
            onChange={handleFormChange}
            required
          />
          <Input
            sizes={"xs"}
            label={"Password"}
            value={addUserFormData.userPassword}
            name="userPassword"
            type="password"
            onChange={handleFormChange}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <DropdownSelect
            name={"userRole"}
            sizes={"xs"}
            label={"Role"}
            value={addUserFormData.userRole ?? ""}
            onChange={handleFormChange}
            options={roleOptions}
            required
          />
        </div>
      </div>
    </div>
  );

  // Step 2: Employee Information (only shown if userRole is "employee")
  const renderEmployeeInfoStep = () => (
    <div className="space-y-5">
      <div className="space-y-3">
        <h1 className="text-md font-semibold mb-3">Employee Information</h1>
        <div className="grid grid-cols-2 gap-4">
          <DropdownSelect
            name={"empPosition"}
            sizes={"xs"}
            label={"Position"}
            value={addUserFormData.empPosition ?? ""}
            onChange={handleFormChange}
            options={positionOptions}
            required
          />
        </div>
      </div>

      {Boolean(
        addUserFormData.empPosition === "supervisor" ||
        addUserFormData.empPosition === "staff",
      ) && (
        <div className="space-y-3">
          <h1 className="text-md font-semibold mb-3">Assign Stores</h1>
          <Table
            showCheckBox
            isRounded={false}
            columns={storeColumn}
            data={response.data}
            onSelectionChange={handleSelectionChange}
            uniqueIdKey="storeId"
          />
        </div>
      )}
    </div>
  );

  // Step 3: Review and Submit
  const renderReviewStep = () => (
    <div className="space-y-5">
      <div className="space-y-3">
        <h1 className="text-md font-semibold mb-3">Review Information</h1>

        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">User Details:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>{" "}
                <span className="font-medium">
                  {addUserFormData.userFname} {addUserFormData.userLname}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>{" "}
                <span className="font-medium">{addUserFormData.userEmail}</span>
              </div>
              <div>
                <span className="text-gray-600">Username:</span>{" "}
                <span className="font-medium">{addUserFormData.userName}</span>
              </div>
              <div>
                <span className="text-gray-600">Role:</span>{" "}
                <span className="font-medium">{addUserFormData.userRole}</span>
              </div>
            </div>
          </div>

          {addUserFormData.userRole === "employee" && (
            <div>
              <h3 className="text-sm font-medium mb-2">Employee Details:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Position:</span>{" "}
                  <span className="font-medium">
                    {addUserFormData.empPosition}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Assigned Stores:</span>{" "}
                  <span className="font-medium">{selectedStores.length}</span>
                </div>
              </div>

              {selectedStores.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-xs font-medium mb-1">Store List:</h4>
                  <ul className="text-sm list-disc list-inside">
                    {selectedStores.map((store) => (
                      <li key={store.storeId}>{store.storeName}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
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

  // Step indicators
  const renderStepIndicators = () => (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center space-x-2">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 1 ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          1
        </div>
        <span className={`text-sm ${currentStep === 1 ? "font-medium" : ""}`}>
          User Info
        </span>
      </div>

      <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>

      <div className="flex items-center space-x-2">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 2 ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          2
        </div>
        <span className={`text-sm ${currentStep === 2 ? "font-medium" : ""}`}>
          {addUserFormData.userRole === "employee"
            ? "Employee Info"
            : "Additional Info"}
        </span>
      </div>

      <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>

      <div className="flex items-center space-x-2">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 3 ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          3
        </div>
        <span className={`text-sm ${currentStep === 3 ? "font-medium" : ""}`}>
          Review & Submit
        </span>
      </div>
    </div>
  );

  // Navigation buttons
  const renderNavigationButtons = () => {
    // const isEmployeeStep =
    //   currentStep === 2 && addUserFormData.userRole === "employee";
    // const isEmployeeWithStores =
    //   isEmployeeStep &&
    //   (addUserFormData.empPosition === "supervisor" ||
    //     addUserFormData.empPosition === "staff");

    return (
      <div className="flex justify-end gap-4 pt-4 border-t">
        <div>
          {currentStep > 1 ? (
            <Button
              size="sm"
              className="text-sm font-semibold"
              color="secondary"
              label="Back"
              onClick={() => {
                !["owner", "super-admin"].includes(
                  addUserFormData.userRole ?? "",
                )
                  ? goToPrevStep()
                  : setCurrentStep(1);
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

        <div className="flex space-x-2">
          {currentStep < 3 ? (
            <Button
              size="sm"
              label="Next"
              className="text-sm font-semibold"
              onClick={() => {
                const continueStep = validateStep1();

                if (!continueStep) {
                  return;
                }

                !["owner", "super-admin"].includes(
                  addUserFormData.userRole ?? "",
                )
                  ? goToNextStep()
                  : setCurrentStep(3);
              }}
            />
          ) : (
            <Button
              size="sm"
              label="Submit"
              className="text-sm font-semibold"
              onClick={handleSubmit}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {renderStepIndicators()}
      {renderCurrentStep()}
      {renderNavigationButtons()}
    </div>
  );
};

export default AddUserModal;
