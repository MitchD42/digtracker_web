import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GWDWithAFE } from '@/types/database'
import { UI } from '@/lib/constants/ui'
import { StatusChart } from '../visualizations/StatusChart'

interface StatusReportProps {
  data: {
    gwds: GWDWithAFE[] | null
    costs: any[] | null
  }
}

export function StatusReport({ data }: StatusReportProps) {
  if (!data.gwds || !data.costs) return null

  return (
    <div className="space-y-6">
      <StatusChart data={data.gwds} />
    </div>
  )
} 