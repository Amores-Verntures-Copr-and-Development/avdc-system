"use client";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table, { Column } from "@/components/shared/Table";
import { DisplayProcurementHistory } from "@/dtos/purchase.dto";
import { useSession } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import React from "react";
import useSWR from "swr";

const ProcurementHistoryPage = () => {
  const { user } = useSession();
  const { data: inventoryResponse = { data: [] } } = useSWR<
    ApiResponse<DisplayProcurementHistory[]>
  >(user ? `/api/procurement-history` : null, fetcher);
  const columns: Column<DisplayProcurementHistory>[] = [
    { key: "#", name: "#", selector: (row, index) => index + 1 },
    {
      key: "suppName",
      name: "Supplier",
      selector: (row) => <span className="">{row.suppName}</span>,
    },
    {
      key: "poNumber",
      name: "PO Number",
      selector: (row) => <span className="font-semibold">{row.poNumber}</span>,
    },

    {
      key: "totalPurchase",
      name: "Total Purchase",
      selector: (row) => (
        <span className="font-semibold">{formatPeso(row.totalPurchase)}</span>
      ),
    },
    {
      key: "poCreatedAt",
      name: "Date",
      selector: (row) => (
        <span className="">{formatDateToWords(row.poCreatedAt)}</span>
      ),
    },
  ];
  return (
    <PageLayout className="gap-2 p-2">
      <PageHeader
        title={"Procurement History"}
        subtitle="Procurement history details and records"
      />
      <div className="flex-1 flex flex-col min-h-0">
        <Table
          columns={columns}
          data={inventoryResponse.data}
          maxHeight="h-full"
        />
      </div>
    </PageLayout>
  );
};

export default ProcurementHistoryPage;
