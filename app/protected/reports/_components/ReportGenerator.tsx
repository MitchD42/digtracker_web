import { Card } from '@/components/ui/card'
import { GWDWithAFE } from '@/types/database'
import { UI } from '@/lib/constants/ui'
import { SummaryReport } from './reports/SummaryReport'
import { CostReport } from './reports/CostReport'
import { StatusReport } from './reports/StatusReport'
import { TimelineReport } from './reports/TimelineReport'

interface ReportGeneratorProps {
  reportType: string
  data: {
    gwds: GWDWithAFE[] | null
    costs: any[] | null
  }
}

export default function ReportGenerator({ reportType, data }: ReportGeneratorProps) {
  // Render different report based on type
  const renderReport = () => {
    switch (reportType) {
      case 'summary':
        return <SummaryReport data={data} />
      case 'cost':
        return <CostReport data={data} />
      case 'status':
        return <StatusReport data={data} />
      case 'timeline':
        return <TimelineReport data={data} />
      default:
        return (
          <div className={UI.emptyState.container}>
            <p className={UI.emptyState.description}>
              Unknown report type selected
            </p>
          </div>
        )
    }
  }

  return (
    <Card className="p-6">
      <div id="report-content">
        {renderReport()}
      </div>
    </Card>
  )
} 