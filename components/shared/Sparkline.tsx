import React from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";

interface SparklineData {
  period: string;
  value: number;
}

interface SparklineProps {
  data: SparklineData[];
  color?: string;
}

const Sparkline = ({ data, color = "#16a34a" }: SparklineProps) => {
  return (
    <div className="h-10 w-full 2xl:h-12">
      {/* debounce keeps this from re-measuring/re-rendering on every frame
          of the sidebar's width transition - without it, each of the several
          sparklines on a page (Sales, Products) re-renders dozens of times
          during that ~300ms animation and the page visibly stutters. */}
      <ResponsiveContainer width="100%" height="100%" debounce={150}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 2, left: 2, bottom: 4 }}
        >
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Sparkline;
