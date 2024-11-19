import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { GWDWithAFE } from '@/types/database'
import { GWD_STATUS_COLORS } from '@/lib/constants/chart-colors'

interface StatusChartProps {
  data: GWDWithAFE[]
}

export function StatusChart({ data }: StatusChartProps) {
  // Process data for the pie chart
  const statusCounts = data.reduce((acc: { [key: string]: number }, gwd) => {
    const status = gwd.status
    if (status) {
      acc[status] = (acc[status] || 0) + 1
    }
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
                fill={GWD_STATUS_COLORS[entry.name as keyof typeof GWD_STATUS_COLORS]}
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