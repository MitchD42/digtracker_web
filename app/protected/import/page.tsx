'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GWD, GWDImport } from '@/types/database'
import GWDComparison from './_components/GWDComparison'
import { ImportHandler } from './_components/ImportHandler'
import { createClient } from '@/utils/supabase/client'
import Papa from 'papaparse'

export default function ImportPage() {
  const [importedGWDs, setImportedGWDs] = useState<GWDImport[]>([])
  const [existingGWDs, setExistingGWDs] = useState<GWD[]>([])
  const [differences, setDifferences] = useState<{
    [key: string]: {
      gwd_id: number | null;
      gwd_number: number;
      field: string;
      existing: any;
      imported: any;
      isNew?: boolean;
      record?: GWDImport;
    }[]
  }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const importHandler = useMemo(() => new ImportHandler(), [])
  const supabase = importHandler.getSupabaseClient()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.group('File Upload Process')
    setIsLoading(true)
    setError(null)
    
    const file = event.target.files?.[0]
    if (!file) {
      console.log('❌ No file selected')
      console.groupEnd()
      setIsLoading(false)
      return
    }
    
    console.log('📁 File selected:', file.name)
    
    Papa.parse<any>(file, {
      header: true,
      transformHeader: (header: string) => importHandler.transformHeader(header),
      transform: (value: string, field: string) => importHandler.transformValue(value, field),
      complete: async (results: Papa.ParseResult<any>) => {
        try {
          console.group('📥 CSV Import Process')
          console.log('1. CSV Data:', {
            totalRows: results.data.length,
            sampleRow: results.data[0] as Record<string, unknown>,
            allFields: Object.keys(results.data[0] as Record<string, unknown>)
          })

          // Process the import
          const {
            importedGWDs: processedData,
            existingGWDs: existingData,
            differences: newDifferences
          } = await importHandler.processImportedData(results.data)

          setImportedGWDs(processedData)
          setExistingGWDs(existingData)
          setDifferences(newDifferences)

        } catch (error) {
          console.error('❌ Import Failed:', error)
          setError(error instanceof Error ? error.message : 'Import failed')
        } finally {
          setIsLoading(false)
          console.groupEnd()
        }
      },
      error: (error: Error) => {
        console.error('CSV Parse Error:', error)
        setError(`CSV Parse Error: ${error.message}`)
        setIsLoading(false)
        console.groupEnd()
      }
    })
  }

  const handleResolution = async (
    gwd_id: number | null, 
    field: string, 
    value: any, 
    isNew?: boolean
  ) => {
    try {
      const fieldName = field as keyof GWD
      
      if (isNew) {
        // Find the correct diffKey for new records
        const diffKey = Object.keys(differences).find(key => {
          const diffs = differences[key]
          return diffs[0]?.isNew && diffs[0]?.gwd_number === differences[String(gwd_id || 0)]?.[0]?.gwd_number
        })

        if (!diffKey || !differences[diffKey]) {
          console.error('Could not find differences for:', { gwd_id, field, value, diffKey })
          throw new Error('Could not find fields for new record')
        }

        const currentDiffs = differences[diffKey]
        
        // Build the new record from all current differences
        const newRecord: Partial<GWD> = {
          ...currentDiffs.reduce<Partial<GWD>>((acc, diff) => ({
            ...acc,
            [diff.field]: diff.imported
          }), {}),
          [fieldName]: value
        }

        console.log('Inserting new record:', newRecord)
        const { data, error } = await supabase
          .from('gwds')
          .insert([newRecord])
          .select()

        if (error) throw error
        console.log('New record inserted:', data)

        // Remove the resolved differences
        setDifferences(prev => {
          const newDiffs = { ...prev }
          if (diffKey) delete newDiffs[diffKey]
          return newDiffs
        })
      } else {
        // Handle existing record update
        const { error } = await supabase
          .from('gwds')
          .update({ [fieldName]: value })
          .eq('gwd_id', gwd_id!)
          .select()

        if (error) throw error

        // Remove the resolved difference
        setDifferences(prev => {
          const newDiffs = { ...prev }
          const key = String(gwd_id)
          if (key && newDiffs[key]) {
            newDiffs[key] = newDiffs[key].filter(d => d.field !== field)
            if (newDiffs[key].length === 0) delete newDiffs[key]
          }
          return newDiffs
        })
      }
    } catch (error) {
      console.error('Error handling resolution:', error)
      setError(error instanceof Error ? error.message : 'Error handling resolution')
    }
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Import/Export GWD Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button asChild disabled={isLoading}>
                <label htmlFor="file-upload">
                  {isLoading ? 'Processing...' : 'Upload CSV File'}
                </label>
              </Button>
            </div>
            
            {error && (
              <div className="text-red-500">{error}</div>
            )}
            
            {Object.keys(differences).length > 0 && (
              <GWDComparison 
                differences={differences}
                onResolution={handleResolution}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 