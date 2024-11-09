"use client"

import { FinancialMetrics } from "@/utils/supabase/dashboard-queries"
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
import type { ChartOptions } from 'chart.js'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface BudgetChartProps {
  data?: FinancialMetrics
}

export function BudgetChart({ data }: BudgetChartProps) {
  if (!data?.afeBreakdown) return null

  const chartData = {
    labels: data.afeBreakdown.map(afe => afe.afeNumber),
    datasets: [
      {
        label: 'Budget',
        data: data.afeBreakdown.map(afe => afe.budget),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Spent',
        data: data.afeBreakdown.map(afe => afe.spent),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }
    ]
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        type: 'linear',
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            if (typeof value === 'number') {
              return `$${value.toLocaleString()}`
            }
            return value
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Budget vs Spent by AFE'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let value = context.raw as number;
            return `${context.dataset.label}: $${value.toLocaleString()}`;
          }
        }
      }
    }
  }

  return (
    <div className="w-full h-[300px]">
      <Bar data={chartData} options={options} />
    </div>
  )
} 