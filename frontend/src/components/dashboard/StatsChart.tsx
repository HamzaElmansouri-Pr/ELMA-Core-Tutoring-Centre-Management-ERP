import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface StatsChartProps {
  breakdown?: any[];
  colors: string[];
}

const StatsChart: React.FC<StatsChartProps> = ({ breakdown, colors }) => {
  if (!breakdown || breakdown.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center text-gray-400">
        No stats data available.
      </div>
    );
  }

  return (
    <div className="h-80 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={breakdown} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip cursor={{fill: 'transparent'}} />
          <Legend />
          <Bar dataKey="Students" fill={colors[0]} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Classes" fill={colors[1]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsChart;
