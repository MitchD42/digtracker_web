import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import { stringify } from 'csv-stringify/sync'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function generateReport(format: string, data: any) {
  const element = document.getElementById('report-content')
  if (!element) throw new Error('Report content not found')

  switch (format) {
    case 'pdf':
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          // Optional: Modify cloned document before rendering
          // For example, you could adjust font sizes here
        }
      })

      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      const pdf = new jsPDF({
        orientation: imgHeight > pageHeight ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
      })

      const imgData = canvas.toDataURL('image/jpeg', 1.0)
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST')

      let heightLeft = imgHeight
      let position = 0
      while (heightLeft >= pageHeight) {
        position = heightLeft - pageHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, -position, imgWidth, imgHeight, undefined, 'FAST')
        heightLeft -= pageHeight
      }

      return saveAs(pdf.output('blob'), `report-${Date.now()}.pdf`)

    case 'excel':
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, 'Report')
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      return saveAs(
        new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 
        `report-${Date.now()}.xlsx`
      )

    case 'csv':
      const csv = stringify(data, { header: true })
      return saveAs(
        new Blob([csv], { type: 'text/csv;charset=utf-8' }), 
        `report-${Date.now()}.csv`
      )

    default:
      throw new Error(`Unsupported format: ${format}`)
  }
} 