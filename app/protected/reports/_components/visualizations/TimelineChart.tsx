import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { GWDWithAFE } from '@/types/database'
import { GWD_STATUSES } from '@/lib/constants/gwd-statuses'

interface TimelineChartProps {
  data: GWDWithAFE[]
}

export function TimelineChart({ data }: TimelineChartProps) {
  // Process data for timeline visualization
  const timelineData = data
    .sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime())
    .map(gwd => ({
      date: new Date(gwd.created_date).toLocaleDateString(),
      'Completed GWDs': (
        gwd.status === GWD_STATUSES['Dig Completed'] || 
        gwd.status === GWD_STATUSES['Dig Report Received']
      ) ? 1 : 0,
      'Active GWDs': (
        gwd.status === GWD_STATUSES['Site Selected'] || 
        gwd.status === GWD_STATUSES['With CLEIR'] || 
        gwd.status === GWD_STATUSES['CLEIR Approved']
      ) ? 1 : 0,
      'Other GWDs': (
        gwd.status === GWD_STATUSES['Dig Cancelled'] || 
        gwd.status === GWD_STATUSES['Dig Postponed']
      ) ? 1 : 0
    }))

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={timelineData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="Completed GWDs" 
            stroke="#22c55e" 
            strokeWidth={2} 
          />
          <Line 
            type="monotone" 
            dataKey="Active GWDs" 
            stroke="#3b82f6" 
            strokeWidth={2} 
          />
          <Line 
            type="monotone" 
            dataKey="Other GWDs" 
            stroke="#6b7280" 
            strokeWidth={2} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 