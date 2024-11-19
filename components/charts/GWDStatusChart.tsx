"use client"

import { GWDMetrics } from "@/utils/supabase/dashboard-queries"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { GWD_STATUS_COLORS } from '@/lib/constants/chart-colors'
import { GWD_STATUS_OPTIONS } from '@/lib/constants/gwd-statuses'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface GWDStatusChartProps {
  data?: GWDMetrics
}

export function GWDStatusChart({ data }: GWDStatusChartProps) {
  if (!data) return null

  const labels = [...GWD_STATUS_OPTIONS]
  
  const chartData = {
    labels,
    datasets: [{
      label: 'GWDs by Status',
      data: labels.map(status => data.statusCounts[status] || 0),
      backgroundColor: labels.map(status => 
        GWD_STATUS_COLORS[status as keyof typeof GWD_STATUS_COLORS]
      )
    }]
  }

  return (
    <div style={{ height: '300px' }}>
      <Bar 
        data={chartData} 
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: `GWDs by Status (Total: ${data.totalCount})`
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }} 
      />
    </div>
  )
} 