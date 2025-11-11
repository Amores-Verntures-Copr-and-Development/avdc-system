import { StoreInterface } from "@/types/stores";
import { formatDateToWords } from "@/utils/formatDateToWords";
import React from "react";
import {
  MapPin,
  Calendar,
  Phone,
  Mail,
  User,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";
import IconButton from "@/components/shared/IconButton";
import Popup from "@/components/shared/Popup";

interface ViewStoreModalProps {
  data: StoreInterface | null;
}

// Mock request schedule data
const mockRequestSchedule = [
  {
    day: "Monday",
    time: "9:00 AM - 11:00 AM",
    notes: "Weekly inventory delivery",
  },
  {
    day: "Wednesday",
    time: "2:00 PM - 4:00 PM",
    notes: "Urgent orders pickup",
  },
  {
    day: "Friday",
    time: "10:00 AM - 12:00 PM",
    notes: "Bulk items delivery",
  },
];

const ViewStoreModal = ({ data }: ViewStoreModalProps) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        No store data available
      </div>
    );
  }

  // Use mock data for demonstration
  const requestSchedule = mockRequestSchedule;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Store Details</h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete information about the store
        </p>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-6 min-h-0">
        {/* Store Details Section */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">
              Store Information
            </h2>
          </div>

          <div className="space-y-4">
            <DetailItem label="Store Name" value={data.storeName} />
            <DetailItem
              label="Location"
              value={data.storeLocation ?? ""}
              icon={<MapPin className="w-4 h-4" />}
            />
            <DetailItem
              label="Contact Phone"
              value={data.storeContactPhone || "Not provided"}
              icon={<Phone className="w-4 h-4" />}
            />
            <DetailItem
              label="Email"
              value={data.storeEmail || "Not provided"}
              icon={<Mail className="w-4 h-4" />}
            />
            <DetailItem
              label="Established"
              value={formatDateToWords(data.storeCreatedAt)}
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="w-px bg-gray-300 mx-2"></div>

        {/* Request Schedule Section */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-medium text-gray-900">
                Request Schedule
              </h2>
            </div>
            <IconButton
              onClick={function (): void {
                throw new Error("Function not implemented.");
              }}
              icon={<Plus />}
              label={"Add Schedule"}
              bg={""}
            />
          </div>

          <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 p-4">
            {requestSchedule.length > 0 ? (
              <div className="space-y-3">
                {requestSchedule.map((schedule, index) => (
                  <div
                    key={index}
                    className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm text-gray-900">
                        {schedule.day}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                          {schedule.time}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit schedule"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete schedule"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {schedule.notes && (
                      <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        {schedule.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Calendar className="w-12 h-12 mb-2" />
                <p className="text-sm">No schedule available</p>
                <p className="text-xs mt-1">
                  Schedule requests will appear here
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Quick Actions
            </h3>
            <div className="flex gap-2">
              <button className="flex-1 bg-primary-1 text-white text-sm py-2 px-3 rounded-lg hover:bg-primary-1-hover transition-colors hover:text-black">
                Contact Store
              </button>
              <button className="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-blue-500 hover:text-black transition-colors">
                View Orders
              </button>
              <button className="flex-1 bg-green-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-green-500 hover:text-black transition-colors">
                View Products
              </button>
            </div>
          </div>
        </div>
      </div>
      <Popup
        isOpen={false}
        onClose={function (): void {
          throw new Error("Function not implemented.");
        }}
      >
        {" "}
      </Popup>
    </div>
  );
};

// Helper component for detail items
interface DetailItemProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

const DetailItem = ({ label, value, icon }: DetailItemProps) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-sm font-medium text-gray-500">{label}:</span>
    </div>
    <span className="text-sm text-gray-900 font-medium">{value}</span>
  </div>
);

export default ViewStoreModal;
