import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import Table, { Column } from "@/components/shared/Table";
import { Reports } from "@/types/report";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { CalendarDays, Clipboard } from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";
import CreateInventoryReport from "../../components/CreateInventoryReport";
import { UserAuth } from "@/hooks/useSession";
import VewInventoryReport from "./_components/VewInventoryReport";
import ViewDailyReport from "./_components/ViewDailyReport";
import CreateDailyReport from "./_components/CreateDailyReport";
interface ReportSectionProps {
  inventoryId: number | null;
  user: UserAuth | null;
}
// reportId: number;
//   reportTitle: string;
//   reportType: ReportType;
//   reportCreatedAt: string;
//   reportUpdatedAt: string;
//   reportDeletedAt: string;
//   inventoryId: number;
//   invReportCreatedBy: number;
const columns: Column<Reports>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  { key: "reportTitle", name: "Name" },
  { key: "reportType", name: "Report Type" },
  {
    key: "reportCreatedAt",
    name: "Date Created",
    selector: (row) => formatDateToWords(row.reportCreatedAt),
  },
];
const ReportSection = ({ inventoryId, user }: ReportSectionProps) => {
  const [showCreateInventoryReport, setShowCreateInventoryReport] =
    useState(false);
  const [showCreateDailyReport, setShowCreateDailyReport] = useState(false);
  const [openModal, setOpenModal] = useState<"inventory" | "daily" | null>(
    null
  );
  const [selectedRow, setSelectedRow] = useState<Reports | undefined>(
    undefined
  );
  const {
    data: itemResponse = { data: [] },
    isLoading: loading,
    mutate,
  } = useSWR<{
    data: Reports[];
  }>(inventoryId ? `/api/report/${inventoryId}` : null, fetcher);
  return (
    <>
      <Table
        loading={loading}
        onRowSelection={(row) => {
          setOpenModal(
            row.reportType === "inventory"
              ? "inventory"
              : row.reportType === "daily"
              ? "daily"
              : null
          );
          setSelectedRow(row);
        }}
        renderTopActions={
          <>
            <div className="flex gap-4">
              <div>
                <Button
                  icon={<Clipboard size={17} />}
                  label="Inventory Report"
                  onClick={() => {
                    setShowCreateInventoryReport(true);
                  }}
                  size="xs"
                  className="font-semibold"
                  color="secondary"
                />
              </div>
              <div>
                <Button
                  icon={<CalendarDays size={17} />}
                  label="Daily Report"
                  onClick={() => {
                    setShowCreateDailyReport(true);
                  }}
                  size="xs"
                  className="font-semibold"
                />
              </div>
            </div>
          </>
        }
        maxHeight="h-full"
        columns={columns}
        data={itemResponse.data}
        totalCount={20}
      />
      <Modal
        isOpen={showCreateInventoryReport}
        onClose={function (): void {
          setShowCreateInventoryReport(false);
        }}
        title="Create Inventory Report"
        size="xl"
        className="h-[95%]"
      >
        <CreateInventoryReport
          inventoryId={inventoryId ?? 0}
          user={user}
          mutateReport={mutate}
          onCancel={() => {
            setShowCreateInventoryReport(false);
          }}
        />
      </Modal>

      <Modal
        isOpen={showCreateDailyReport}
        onClose={function (): void {
          setShowCreateDailyReport(false);
        }}
        title="Create Daily Inventory Report"
        size="xl"
        className="h-[95%]"
      >
        <CreateDailyReport
          inventoryId={inventoryId ?? 0}
          user={user}
          mutate={mutate}
          onCancel={() => {
            setShowCreateDailyReport(false);
          }}
        />
      </Modal>
      {openModal === "inventory" ? (
        <Modal
          title={`Inventory Report`}
          size="xl"
          className="h-[95%]"
          isOpen={openModal === "inventory"}
          onClose={function (): void {
            setOpenModal(null);
          }}
        >
          <VewInventoryReport report={selectedRow} />
        </Modal>
      ) : (
        <Modal
          title={`Inventory Report`}
          size="xl"
          className="h-[95%]"
          isOpen={openModal === "daily"}
          onClose={function (): void {
            setOpenModal(null);
          }}
        >
          <ViewDailyReport />
        </Modal>
      )}
    </>
  );
};

export default ReportSection;
