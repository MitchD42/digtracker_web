import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GWDWithAFE } from '@/types/database'
import { UI } from '@/lib/constants/ui'
import { TimelineChart } from '../visualizations/TimelineChart'

interface TimelineReportProps {
  data: {
    gwds: GWDWithAFE[] | null
    costs: any[] | null
  }
}

export function TimelineReport({ data }: TimelineReportProps) {
  if (!data.gwds || !data.costs) return null

  return (
    <div className="space-y-6">
      <TimelineChart data={data.gwds} />
    </div>
  )
} 