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
  console.log('GWDStatusChart received data:', data)
  
  if (!data) {
    console.log('No data provided to GWDStatusChart')
    return null
  }

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

  console.log('Chart data prepared:', chartData)

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