import { formatPeso } from "@/utils/formatPeso";

export const PaymentBreakdown = ({
  data,
  total,
}: {
  data?: any[];
  total: number;
}) => {
  if (!data?.length) return null;

  return (
    <div className="hidden   lg:grid grid-cols-2 2xl:grid-cols-1 gap-3">
      {data.map((method) => {
        const pct =
          total > 0
            ? Math.min((Number(method.salesPayAmount) / total) * 100, 100)
            : 0;

        return (
          <div key={method.payMetName}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="truncate text-[8px] 2xl:text-xs text-gray-500">
                {method.payMetName}
              </span>
              <span className="text-[10px] 2xl:text-xs font-semibold text-gray-800">
                {formatPeso(Number(method.salesPayAmount))}
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-primary-1"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
