"use client"

import { GWDMetrics } from "@/utils/supabase/dashboard-queries"
import { Bar } from "react-chartjs-2"

interface GWDStatusChartProps {
  data?: GWDMetrics
}

export function GWDStatusChart({ data }: GWDStatusChartProps) {
  if (!data) return null

  const chartData = {
    labels: Object.keys(data.statusCounts),
    datasets: [{
      label: 'GWDs by Status',
      data: Object.values(data.statusCounts),
      backgroundColor: [
        '#4CAF50', // Complete
        '#2196F3', // In Progress
        '#F44336', // Cancelled
        '#FFC107', // On Hold
        '#9E9E9E', // Not Started
        '#FF9800', // Waiting for CLEIR
        '#8BC34A', // Ready
        '#607D8B'  // No Longer Mine
      ]
    }]
  }

  return (
    <Bar data={chartData} options={{
      responsive: true,
      maintainAspectRatio: false
    }} />
  )
} 