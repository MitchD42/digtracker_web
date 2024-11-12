import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Download, 
  Mail, 
  FileSpreadsheet,
  FileText,
  FileDown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'

// First, install the missing type definitions:
// npm i --save-dev @types/file-saver

interface ReportActionsProps {
  onExport?: (format: string) => void
  onEmail?: () => void
  data: any // Replace with your actual data type
}

export function ReportActions({
  onExport,
  onEmail,
  data
}: ReportActionsProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: string) => {
    setIsExporting(true)
    try {
      const reportElement = document.getElementById('report-content')
      if (!reportElement) throw new Error('Report content not found')

      switch (format) {
        case 'pdf':
          const element = document.getElementById('report-content')
          if (!element) throw new Error('Report content not found')
          
          const canvas = await html2canvas(element)
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
          })
          
          const imgData = canvas.toDataURL('image/png')
          pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
          
          saveAs(pdf.output('blob'), `report-${Date.now()}.pdf`)
          break
        
        case 'excel':
          const ws = XLSX.utils.json_to_sheet(data)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, 'Report')
          const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
          const excelBlob = new Blob([excelBuffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          })
          saveAs(excelBlob, `report-${Date.now()}.xlsx`)
          break
        
        case 'csv':
          const csvData = Papa.unparse(data)
          const csvBlob = new Blob([csvData], { 
            type: 'text/csv;charset=utf-8' 
          })
          saveAs(csvBlob, `report-${Date.now()}.csv`)
          break
      }

      onExport?.(format)
      toast.success(`Report exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export report')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              disabled={isExporting}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport('pdf')}>
              <FileDown className="mr-2 h-4 w-4" />
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('excel')}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              <FileText className="mr-2 h-4 w-4" />
              CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Email Button */}
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={onEmail}
        >
          <Mail className="mr-2 h-4 w-4" />
          Email
        </Button>
      </CardContent>
    </Card>
  )
} 