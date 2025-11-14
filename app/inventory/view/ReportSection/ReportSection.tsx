import Button from "@/components/shared/Button";
import Table from "@/components/shared/Table";
import { CalendarDays, Clipboard } from "lucide-react";
import React from "react";

const ReportSection = () => {
  return (
    <>
      <Table
        renderTopActions={
          <>
            <div className="flex gap-4">
              <div>
                <Button
                  icon={<Clipboard size={17} />}
                  label="Inventory Report"
                  onClick={() => {}}
                  size="xs"
                  className="font-semibold"
                  color="nocolor"
                />
              </div>
              <div>
                <Button
                  icon={<CalendarDays size={17} />}
                  label="Daily Report"
                  onClick={() => {}}
                  size="xs"
                  className="font-semibold"
                />
              </div>
            </div>
          </>
        }
        maxHeight="h-full"
        columns={[]}
        data={[]}
        totalCount={20}
      />
    </>
  );
};

export default ReportSection;
