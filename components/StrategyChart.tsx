'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { AnalysisResult } from '../lib/types';

interface StrategyChartProps {
  summary: AnalysisResult['summary'];
}

const COLORS = {
  SSG: '#10b981', // emerald-500
  SSR: '#8b5cf6', // purple-500
  ISR: '#3b82f6', // blue-500
  CSR: '#f59e0b', // amber-500
};

export default function StrategyChart({ summary }: StrategyChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const data = [
    { name: 'SSG', value: summary.SSG },
    { name: 'SSR', value: summary.SSR },
    { name: 'ISR', value: summary.ISR },
    { name: 'CSR', value: summary.CSR },
  ].filter(item => item.value > 0);

  if (!isMounted) {
    return <div className="h-64 flex items-center justify-center text-gray-500">Loading chart...</div>;
  }

  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-500">No data to display</div>;
  }

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={2}
            animationDuration={1500}
            animationBegin={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white' }}
            itemStyle={{ color: 'white' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
