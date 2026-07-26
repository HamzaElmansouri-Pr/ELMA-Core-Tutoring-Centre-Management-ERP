import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface RevenueChartProps {
  breakdown?: any[];
  colors: string[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ breakdown, colors }) => {
  if (!breakdown || breakdown.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center text-gray-400">
        No revenue data available for the last 6 months.
      </div>
    );
  }

  return (
    <div className="h-80 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={breakdown} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(val) => `${val / 100} DH`} />
          <Tooltip 
            formatter={(value: any) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'DZD' }).format(value)} 
          />
          <Legend />
          {Object.keys(breakdown[0] || {}).filter(k => k !== 'name').map((subject, idx) => (
            <Line 
              key={subject} 
              type="monotone" 
              dataKey={subject} 
              stroke={colors[idx % colors.length]} 
              strokeWidth={2}
              activeDot={{ r: 8 }} 
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
