import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { GWDWithAFE } from '@/types/database'
import { UI } from '@/lib/constants/ui'

interface StatusChartProps {
  data: GWDWithAFE[]
}

// Define status colors
const STATUS_COLORS = {
  'Complete': '#22c55e',       // green-500
  'In Progress': '#3b82f6',    // blue-500
  'Cancelled': '#ef4444',      // red-500
  'On Hold': '#f59e0b',        // amber-500
  'Not Started': '#6b7280',    // gray-500
  'Waiting for CLEIR': '#8b5cf6', // violet-500
  'Ready': '#10b981',          // emerald-500
  'No Longer Mine': '#64748b'  // slate-500
}

export function StatusChart({ data }: StatusChartProps) {
  // Process data for the pie chart
  const statusCounts = data.reduce((acc: { [key: string]: number }, gwd) => {
    const status = gwd.status || 'Unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count
  }))

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => 
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || '#cbd5e1'}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
} 