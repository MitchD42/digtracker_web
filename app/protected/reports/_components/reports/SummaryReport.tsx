import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GWDWithAFE } from '@/types/database'
import { UI } from '@/lib/constants/ui'
import { StatusChart } from '@/app/protected/reports/_components/visualizations/StatusChart'
import { CostOverview } from '@/app/protected/reports/_components/visualizations/CostOverview'
import { GWDStatus, GWD_STATUSES } from '@/lib/constants/gwd-statuses'

interface SummaryReportProps {
  data: {
    gwds: GWDWithAFE[] | null
    costs: any[] | null
  }
}

export function SummaryReport({ data }: SummaryReportProps) {
  if (!data.gwds || !data.costs) return null

  // Calculate summary statistics
  const totalGWDs = data.gwds.length
  
  const activeGWDs = data.gwds.filter(gwd => 
    gwd.status === GWD_STATUSES['Site Selected'] || 
    gwd.status === GWD_STATUSES['With CLEIR'] || 
    gwd.status === GWD_STATUSES['CLEIR Approved']
  ).length
  
  const completedGWDs = data.gwds.filter(gwd => 
    gwd.status === GWD_STATUSES['Dig Completed'] || 
    gwd.status === GWD_STATUSES['Dig Report Received']
  ).length
  
  const totalBudget = data.gwds.reduce((sum, gwd) => sum + (gwd.initial_budget || 0), 0)
  const totalCost = data.gwds.reduce((sum, gwd) => sum + (gwd.land_cost || 0) + (gwd.dig_cost || 0), 0)

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className={UI.text.label}>Total GWDs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={UI.text.title + " text-2xl"}>{totalGWDs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className={UI.text.label}>Active GWDs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={UI.text.title + " text-2xl"}>{activeGWDs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className={UI.text.label}>Completed GWDs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={UI.text.title + " text-2xl"}>{completedGWDs}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusChart data={data.gwds} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cost Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <CostOverview 
              totalBudget={totalBudget}
              totalCost={totalCost}
              data={data.costs}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent GWDs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent GWDs</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add table of recent GWDs here */}
        </CardContent>
      </Card>
    </div>
  )
} 