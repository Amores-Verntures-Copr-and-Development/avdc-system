import IconButton from "@/components/shared/IconButton";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table, { Column } from "@/components/shared/Table";
import { DisplaySalesDto } from "@/dtos/sales.dto";
import { UserAuth } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import { Sales } from "@/types/sales";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import { Eye } from "lucide-react";
import React from "react";
import useSWR from "swr";
interface SalesPageProps {
  storeId: number;
  user: UserAuth | null;
}
const columns: Column<DisplaySalesDto>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  {
    key: "salesNo",
    name: "Sales No",
    selector: (row) => <span className="font-semibold">{row.salesNo}</span>,
  },
  {
    key: "salesInvoice",
    name: "Invoice No",
    selector: (row) => (
      <span className="font-semibold">#{row.salesInvoice}</span>
    ),
  },

  {
    key: "salesSubTotal ",
    name: "Subtotal",
    selector: (row) => (
      <span className="text-[11px] ">{formatPeso(row.salesSubTotal)}</span>
    ),
  },
  {
    key: "salesTotalAmount",
    name: "Total Amount",
    selector: (row) => (
      <span className="font-semibold">{formatPeso(row.salesTotalAmount)}</span>
    ),
  },
  { key: "customerId", name: "Customer" },
  { key: "salesCreatedByName", name: "Created By" },
  {
    key: "salesCreatedAt",
    name: "Created At",
    selector: (row) => formatDateToWords(row.salesCreatedAt ?? ""),
  },
];
const SalesPage = ({ storeId, user }: SalesPageProps) => {
  const { data: response, mutate } = useSWR<ApiResponse<DisplaySalesDto[]>>(
    user && storeId ? `/api/sales/${storeId}` : null,
    fetcher
  );
  return (
    <PageLayout className="p-2 gap-2">
      <PageHeader title={"Sales"} subtitle="Manage sales" />
      <div className="grid grid-cols-4 gap-2 h-20">
        <div className="p-4 bg-white shadow"></div>
        <div className="p-4 bg-white shadow"></div>
        <div className="p-4 bg-white shadow"></div>
        <div className="p-4 bg-white shadow"></div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <Table
          renderTopActions
          searchUrl="/sales"
          isRounded={false}
          columns={columns}
          data={response?.data ?? []}
          maxHeight="h-full"
          showActions
          renderActions={(row) => (
            <div className="flex justify-center">
              <IconButton
                onClick={function (): void {
                  throw new Error("Function not implemented.");
                }}
                label={"View"}
                bg={"gray"}
                icon={<Eye className="w-4 h-4" />}
              />
            </div>
          )}
          totalCount={100}
        />
      </div>
    </PageLayout>
  );
};

export default SalesPage;
