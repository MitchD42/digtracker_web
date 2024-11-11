import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ReportListProps {
  onSelect: (type: string) => void
  selected: string | null
}

export default function ReportList({ onSelect, selected }: ReportListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Types</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant={selected === 'summary' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => onSelect('summary')}
        >
          Summary Report
        </Button>
        <Button
          variant={selected === 'cost' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => onSelect('cost')}
        >
          Cost Analysis
        </Button>
        <Button
          variant={selected === 'status' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => onSelect('status')}
        >
          Status Report
        </Button>
        <Button
          variant={selected === 'timeline' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => onSelect('timeline')}
        >
          Timeline Report
        </Button>
      </CardContent>
    </Card>
  )
} 