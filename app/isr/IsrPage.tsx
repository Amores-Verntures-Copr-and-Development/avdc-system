"use client";

import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import { Plus } from "lucide-react";
import React, { useState } from "react";
import AddISRComponent from "./components/AddISRComponent";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import { ApiResponse } from "@/types/api";
import { InterStoreRequests } from "@/types/isr";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shared/CustomCard";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { useRouter } from "next/navigation";

const IsrPage = () => {
  const [showAdd, setShowAdd] = useState(false);
  const router = useRouter();
  const { data: response, isLoading } = useSWR<
    ApiResponse<InterStoreRequests[]>
  >(`/api/isr`, fetcher);

  return (
    <PageLayout className="p-2 gap-4">
      <div className="flex justify-between items-center">
        {" "}
        <PageHeader
          title={"Inter-Store Requisition"}
          subtitle="Configure who can create request, who will receive them, who will handle purchasing"
        />
        <div>
          <Button
            label="Create ISR"
            size="sm"
            onClick={() => {
              setShowAdd(true);
            }}
            icon={Plus}
          />
        </div>
      </div>
      <div className="grid grid-cols-5">
        {isLoading ? (
          <div></div>
        ) : (
          response?.data.map((isr) => (
            <Card
              className="
    cursor-pointer
    transition-all
    duration-200
    hover:shadow-lg
    hover:-translate-y-1
    hover:border-primary/30
  "
              key={isr.isrId}
              onClick={() => {
                router.push(`/isr/${isr.isrCode}`);
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{isr.isrCode}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {isr.isrName}
                    </p>
                  </div>

                  <span className="text-xs text-muted-foreground">
                    {formatDateToWords(isr.isrCreatedAt)}
                  </span>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      <Modal
        isOpen={showAdd}
        onClose={() => {
          setShowAdd(false);
        }}
        title="Create Inter-Store Requisition"
      >
        <AddISRComponent
          mutate={function (): void {
            throw new Error("Function not implemented.");
          }}
          onCancel={function (): void {
            setShowAdd(false);
          }}
        />
      </Modal>
    </PageLayout>
  );
};

export default IsrPage;
