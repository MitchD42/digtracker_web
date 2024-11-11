import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { UI } from '@/lib/constants/ui'

interface CostOverviewProps {
  totalBudget: number
  totalCost: number
  data: any[]
}

export function CostOverview({ totalBudget, totalCost, data }: CostOverviewProps) {
  // Process data for the chart
  const costData = data.map(item => ({
    name: `GWD ${item.gwd_number}`,
    Budget: item.initial_budget || 0,
    'Land Cost': item.land_cost || 0,
    'Dig Cost': item.dig_cost || 0,
    'Total Cost': (item.land_cost || 0) + (item.dig_cost || 0)
  }))

  // Calculate budget variance
  const variance = totalBudget - totalCost
  const variancePercent = ((variance / totalBudget) * 100).toFixed(1)
  const isOverBudget = variance < 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className={UI.containers.card}>
          <div className={UI.text.label}>Total Budget</div>
          <div className={UI.text.title + " text-xl"}>
            ${totalBudget.toLocaleString()}
          </div>
        </div>
        <div className={UI.containers.card}>
          <div className={UI.text.label}>Total Cost</div>
          <div className={`${UI.text.title} text-xl ${isOverBudget ? 'text-red-500' : ''}`}>
            ${totalCost.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Variance Indicator */}
      <div className={`${UI.containers.card} ${isOverBudget ? 'bg-red-50 dark:bg-red-900/10' : 'bg-green-50 dark:bg-green-900/10'}`}>
        <div className={UI.text.label}>Budget Variance</div>
        <div className={`${UI.text.title} text-lg ${isOverBudget ? 'text-red-500' : 'text-green-500'}`}>
          {isOverBudget ? '-' : '+'} ${Math.abs(variance).toLocaleString()} ({variancePercent}%)
        </div>
      </div>

      {/* Cost Breakdown Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={costData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Budget" fill="#3b82f6" /> {/* blue-500 */}
            <Bar dataKey="Land Cost" fill="#22c55e" /> {/* green-500 */}
            <Bar dataKey="Dig Cost" fill="#f59e0b" /> {/* amber-500 */}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 