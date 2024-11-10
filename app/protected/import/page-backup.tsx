'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GWD, GWDImport } from '@/types/database'
import GWDComparison from './_components/GWDComparison'
import { createClient } from '@/utils/supabase/client'
import Papa from 'papaparse'

// Add this type to handle the dynamic field access
type GWDKeys = keyof GWD;

// Add this utility function at the top of the file, after the imports
function chunk<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  )
}

export default function ImportPage() {
  const supabase = createClient()
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.group('File Upload Process')
    
    const file = event.target.files?.[0]
    if (!file) {
      console.log('❌ No file selected')
      console.groupEnd()
      return
    }
    
    console.log('📁 File selected:', file.name)
    
    Papa.parse(file, {
      header: true,
      transformHeader: (header: string) => {
        const cleaned = header.trim()
        
        const headerMap: { [key: string]: string } = {
          'ID': 'digtracker_id',
          'System': 'system',
          'Pipeline': 'pipeline',
          'Execution Year': 'execution_year',
          'Target Girth Weld': 'gwd_number',
          'Dig Name': 'dig_name',
          'Name_of_Inspection_Service_Provider': 'inspection_provider',
          'Dig_Status': 'status',
          'ILI Used For Analysis': 'ili_analysis',
          'Dig Criteria': 'dig_criteria',
          'Inspection Start - Relative to Target G/W (m': 'inspection_start_relative',
          'Inspection End - Relative to Target G/W (m)': 'inspection_end_relative',
          'Inspection Length (m)': 'inspection_length',
          'Target Feature(s) - Include Feature ID\'s if possible': 'target_features',
          'SMYS': 'smys',
          'MOP': 'mop',
          'Design Factor': 'design_factor',
          'Class Location': 'class_location',
          'Class Location Factor': 'class_location_factor',
          'P-Failure (kPa)': 'p_failure',
          'Latitude': 'latitude',
          'Longitude': 'longitude',
          'Program Engineer Name': 'program_engineer',
          'Program Engineer Comments': 'program_engineer_comments',
          'Project Engineer Name': 'project_engineer',
          'Post-Execution Comments': 'post_execution_comments',
          'LastUpdated': 'last_updated',
          'Created By': 'created_by',
          'Date Excavation/Inspection was Completed': 'inspection_completion_date',
          'Actual Inspection Start Ref Girth Weld': 'actual_inspection_start',
          'Actual Inspection Start (relative to RGW)': 'actual_inspection_start_relative',
          'Actual Inspection End (relative to RGW)': 'actual_inspection_end_relative',
          'Actual Inspection Length (m)': 'actual_inspection_length'
        }
        
        return headerMap[cleaned] || cleaned.toLowerCase().replace(/\s+/g, '_')
      },
      transform: (value: string, field: string) => {
        if (field === '_ignore_') {
          return undefined
        }
        
        if (value === '') return null
        
        const integerFields = [
          'digtracker_id',
          'gwd_number',
          'execution_year',
          'class_location',
          'b_sleeve',
          'petro_sleeve',
          'composite',
          'recoat'
        ]
        
        const numericFields = [
          'initial_budget',
          'land_cost',
          'dig_cost',
          'inspection_start_relative',
          'inspection_end_relative',
          'inspection_length',
          'smys',
          'mop',
          'design_factor',
          'class_location_factor',
          'p_failure',
          'latitude',
          'longitude',
          'actual_inspection_start',
          'actual_inspection_start_relative',
          'actual_inspection_end_relative',
          'actual_inspection_length'
        ]
        
        // Handle text fields first
        const textFields = [
          'dig_name',
          'system',
          'pipeline',
          'status',
          'notes',
          'inspection_provider',
          'ili_analysis',
          'dig_criteria',
          'target_features',
          'program_engineer',
          'program_engineer_comments',
          'project_engineer',
          'post_execution_comments',
          'created_by'
        ]

        if (textFields.includes(field)) {
          return value.trim()
        }
        
        if (integerFields.includes(field)) {
          const num = parseInt(value)
          return isNaN(num) ? null : num
        }
        
        if (numericFields.includes(field)) {
          const num = parseFloat(value)
          return isNaN(num) ? null : num
        }
        
        const dateFields = ['inspection_completion_date']
        if (dateFields.includes(field)) {
          return value ? value : null
        }
        
        const timestampFields = ['last_updated', 'created_date']
        if (timestampFields.includes(field)) {
          return value ? new Date(value).toISOString() : null
        }
        
        if (field === 'status') {
          // Define status mappings from import values to database values
          const statusMap: { [key: string]: GWD['status'] } = {
            'CLEIR Approved': 'Ready',
            'Dig Cancelled': 'Cancelled',
            'Dig Completed': 'Complete',
            'Dig Postponed': 'On Hold',
            'Dig Report Received': 'Complete',
            'Site Selected': 'Not Started',
            'With CLEIR': 'Waiting for CLEIR'
          }

          // Clean up the input status
          const cleanedStatus = value.trim().replace(/\s+/g, ' ')
          const mappedStatus = statusMap[cleanedStatus]

          if (mappedStatus) {
            return mappedStatus
          }

          // Log unknown status values
          console.warn(`Unknown status value "${value}" defaulting to "Not Started"`)
          return 'Not Started'
        }
        
        return value
      },
      complete: async (results) => {
        try {
          // 1. Initial CSV parse
          console.group('📥 CSV Import Process')
          console.log('1. CSV Data:', {
            totalRows: results.data.length,
            sampleRow: results.data[0] as Record<string, unknown>,
            allFields: Object.keys(results.data[0] as Record<string, unknown>)
          })

          // 2. After cleaning/transformation
          const cleanData = results.data.map((row: unknown) => {
            const typedRow = row as Record<string, unknown>
            
            // Create a clean object with only the fields we want
            const cleaned: Partial<GWDImport> = {}
            
            // Explicitly map only the fields we want
            const validFields = [
              'digtracker_id',
              'gwd_number',
              'system',
              'pipeline',
              'execution_year',
              'dig_name',
              'inspection_provider',
              'status',
              'ili_analysis',
              'dig_criteria',
              'inspection_start_relative',
              'inspection_end_relative',
              'inspection_length',
              'target_features',
              'smys',
              'mop',
              'design_factor',
              'class_location',
              'class_location_factor',
              'p_failure',
              'latitude',
              'longitude',
              'program_engineer',
              'program_engineer_comments',
              'project_engineer',
              'post_execution_comments',
              'last_updated',
              'created_by',
              'inspection_completion_date',
              'actual_inspection_start',
              'actual_inspection_start_relative',
              'actual_inspection_end_relative',
              'actual_inspection_length'
            ] as const

            validFields.forEach(field => {
              if (field in typedRow) {
                // Type assertion to handle the unknown value
                cleaned[field as keyof GWDImport] = typedRow[field] as any
              }
            })

            return cleaned as GWDImport
          })

          console.log('2. Cleaned Data:', {
            totalRows: cleanData.length,
            sampleRow: cleanData[0],
            allFields: Object.keys(cleanData[0])
          })

          // Add verification logging
          console.log('Verification:', {
            firstRow: cleanData[0],
            fields: Object.keys(cleanData[0])
          })

          // Add this before the chunks are created
          const validData = cleanData.filter(row => {
            // Check for required fields
            if (!row.gwd_number) {
              console.warn('Skipping row due to missing gwd_number:', row)
              return false
            }
            return true
          })

          console.log('Data validation:', {
            originalCount: cleanData.length,
            validCount: validData.length,
            skippedCount: cleanData.length - validData.length
          })

          // Get all gwd_numbers from valid data using Array.from instead of spread
          const gwdNumbers = Array.from(new Set(validData.map(row => row.gwd_number)))

          console.log('Fetching existing GWDs for comparison:', {
            uniqueGwdNumbers: gwdNumbers.length
          })

          // Fetch existing GWDs that match our import
          try {
            const { data: existingGWDs, error: fetchError } = await supabase
              .from('gwds')
              .select('*')
              .in('gwd_number', gwdNumbers)

            if (fetchError) {
              throw fetchError
            }

            console.log('Existing GWDs found:', {
              count: existingGWDs?.length || 0,
              sample: existingGWDs?.[0]
            })

            // Set state for existing and imported GWDs
            setExistingGWDs(existingGWDs || [])
            setImportedGWDs(validData)

            // Compare and set differences
            compareGWDs(existingGWDs || [], validData)

            // Only proceed with insert for new GWDs
            const existingNumbers = new Set(existingGWDs?.map(gwd => gwd.gwd_number) || [])
            const newGWDs = validData.filter(gwd => !existingNumbers.has(gwd.gwd_number))

            console.log('New GWDs to insert:', {
              count: newGWDs.length,
              sample: newGWDs[0]
            })

            // Continue with chunking and insertion of new GWDs
            if (newGWDs.length > 0) {
              const chunks = chunk(newGWDs, 100)
              console.log('3. Ready for Insert:', {
                totalChunks: chunks.length,
                firstChunkSample: chunks[0]?.[0] ?? null
              })

              // First chunk details logging
              console.log('First chunk details:', {
                size: chunks[0]?.length ?? 0,
                sample: chunks[0]?.slice(0, 3).map(row => ({
                  gwd_number: row.gwd_number,
                  digtracker_id: row.digtracker_id,
                  system: row.system
                })) ?? []
              })

              // Process chunks only if we have them
              for (let i = 0; i < chunks.length; i++) {
                try {
                  const chunk = chunks[i]
                  console.log(`Processing chunk ${i + 1}/${chunks.length}:`, {
                    size: chunk.length,
                    hasNullGwdNumber: chunk.some(row => !row.gwd_number)
                  })
                  
                  const { data: insertedData, error: insertError } = await supabase
                    .from('gwds_import')
                    .insert(chunk)
                    .select()

                  if (insertError) {
                    console.error('❌ Supabase Error:', {
                      error: insertError,
                      code: insertError.code,
                      message: insertError.message,
                      details: insertError.details
                    })
                    throw insertError
                  }
                } catch (error) {
                  console.error('❌ Error processing chunk:', error)
                  setError(error instanceof Error ? error.message : 'Error processing chunk')
                  console.groupEnd()
                }
              }
            } else {
              console.log('No new records to process, skipping chunk insertion')
            }
            console.groupEnd()

          } catch (error) {
            console.error('❌ Error fetching existing GWDs:', error)
            setError(error instanceof Error ? error.message : 'Error fetching existing GWDs')
            console.groupEnd()
          }

          // After all chunks are inserted into gwds_import
          try {
            // Get all the records we just imported
            const { data: importedRecords, error: importFetchError } = await supabase
              .from('gwds_import')
              .select('*')
              .filter('digtracker_id', 'not.is', null)

            if (importFetchError) throw importFetchError

            // Get existing records from gwds that match our digtracker_ids
            const digTrackerIds = importedRecords
              ?.map(record => record.digtracker_id)
              .filter(id => id != null)

            const { data: existingGWDs, error: gwdFetchError } = await supabase
              .from('gwds')
              .select('*')
              .in('digtracker_id', digTrackerIds || [])

            if (gwdFetchError) throw gwdFetchError

            console.log('Comparison setup:', {
              importedCount: importedRecords?.length || 0,
              existingCount: existingGWDs?.length || 0,
              newRecordsCount: importedRecords?.filter(
                record => !existingGWDs?.some(
                  existing => existing.digtracker_id === record.digtracker_id
                )
              ).length || 0
            })

            // For records with no matching digtracker_id in gwds, prepare them for insertion
            const newRecords = importedRecords?.filter(
              record => !existingGWDs?.some(
                existing => existing.digtracker_id === record.digtracker_id
              )
            ).map(record => {
              // Convert to GWD format, explicitly picking only the fields we want
              const gwdRecord: Partial<GWD> = {
                digtracker_id: record.digtracker_id,
                gwd_number: record.gwd_number,
                system: record.system,
                pipeline: record.pipeline,
                status: record.status,
                execution_year: record.execution_year,
                dig_name: record.dig_name,
                inspection_provider: record.inspection_provider,
                ili_analysis: record.ili_analysis,
                dig_criteria: record.dig_criteria,
                inspection_start_relative: record.inspection_start_relative,
                inspection_end_relative: record.inspection_end_relative,
                inspection_length: record.inspection_length,
                target_features: record.target_features,
                smys: record.smys,
                mop: record.mop,
                design_factor: record.design_factor,
                class_location: record.class_location,
                class_location_factor: record.class_location_factor,
                p_failure: record.p_failure,
                latitude: record.latitude,
                longitude: record.longitude,
                program_engineer: record.program_engineer,
                program_engineer_comments: record.program_engineer_comments,
                project_engineer: record.project_engineer,
                post_execution_comments: record.post_execution_comments,
                last_updated: record.last_updated,
                created_by: record.created_by,
                inspection_completion_date: record.inspection_completion_date,
                actual_inspection_start: record.actual_inspection_start,
                actual_inspection_start_relative: record.actual_inspection_start_relative,
                actual_inspection_end_relative: record.actual_inspection_end_relative,
                actual_inspection_length: record.actual_inspection_length
              }
              return gwdRecord
            }) || []

            if (newRecords.length > 0) {
              console.log('New records sample:', {
                count: newRecords.length,
                firstRecord: newRecords[0],
                fields: Object.keys(newRecords[0])
              })

              const { error: insertError } = await supabase
                .from('gwds')
                .insert(newRecords)

              if (insertError) {
                console.error('Insert error:', insertError)
                throw insertError
              }
              
              console.log(`Inserted ${newRecords.length} new records into gwds`)
            }

            // Set state for comparison of matching records
            setExistingGWDs(existingGWDs || [])
            setImportedGWDs(importedRecords || [])
            
            // Run comparison to show differences for matching records
            compareGWDs(existingGWDs || [], importedRecords || [])

          } catch (error) {
            console.error('Error setting up comparison:', error)
            setError(error instanceof Error ? error.message : 'Error setting up comparison')
          }

        } catch (error) {
          console.error('❌ Import Failed:', error)
          setError(error instanceof Error ? error.message : 'Import failed')
          console.groupEnd()
        }
      },
      error: (error) => {
        console.error('❌ Error parsing CSV:', error)
        console.groupEnd()
      }
    })
  }

  const convertImportToGWD = (importedGWD: GWDImport): Partial<GWD> => {
    // Create a type for the fields we want to omit
    type OmittedFields = 'gwd_id' | 'import_date' | 'sync_status';
    
    // Use type assertion to handle the fields we know exist in GWDImport
    const { gwd_id, import_date, sync_status, ...rest } = importedGWD as 
      GWDImport & Record<OmittedFields, any>;
    
    return rest;
  }

  const compareGWDs = (existing: GWD[], imported: GWDImport[]) => {
    console.group('🔍 compareGWDs called')
    console.log('Inputs:', {
      existingCount: existing.length,
      importedCount: imported.length
    })

    const diffs: {
      [key: string]: {
        gwd_id: number | null;
        gwd_number: number;
        field: string;
        existing: any;
        imported: any;
        isNew?: boolean;
      }[]
    } = {};

    // Create a map of existing records by digtracker_id for faster lookups
    const existingByDigTrackerId = new Map(
      existing.map(gwd => [gwd.digtracker_id, gwd])
    )

    imported.forEach(importedGWD => {
      const existingGWD = existingByDigTrackerId.get(importedGWD.digtracker_id)
      
      if (!existingGWD) {
        // New record - no matching digtracker_id
        const key = `new_${importedGWD.digtracker_id}`
        const newRecordDiffs = Object.keys(importedGWD)
          .filter(key => !['gwd_id', 'import_date', 'sync_status', 'created_date'].includes(key))
          .map(field => ({
            gwd_id: null,
            gwd_number: importedGWD.gwd_number,
            field,
            existing: null,
            imported: importedGWD[field as keyof GWDImport],
            isNew: true
          }))

        diffs[key] = newRecordDiffs
      } else {
        // Existing record - compare fields
        const key = String(existingGWD.gwd_id)
        const fieldDiffs = Object.keys(importedGWD)
          .filter(field => !['gwd_id', 'import_date', 'sync_status', 'created_date'].includes(field))
          .filter(field => importedGWD[field as keyof GWDImport] !== existingGWD[field as keyof GWD])
          .map(field => ({
            gwd_id: existingGWD.gwd_id,
            gwd_number: importedGWD.gwd_number,
            field,
            existing: existingGWD[field as keyof GWD],
            imported: importedGWD[field as keyof GWDImport],
            isNew: false
          }))

        if (fieldDiffs.length > 0) {
          diffs[key] = fieldDiffs
        }
      }
    })

    console.log('Setting differences:', {
      diffKeys: Object.keys(diffs),
      diffCount: Object.keys(diffs).length,
      sample: Object.entries(diffs)[0]
    })
    console.groupEnd()

    setDifferences(diffs)
  }

  // Add useEffect to manage state updates
  useEffect(() => {
    if (importedGWDs.length > 0 && existingGWDs.length > 0) {
      compareGWDs(existingGWDs, importedGWDs)
    }
  }, [importedGWDs, existingGWDs])

  const handleResolution = async (
    gwd_id: number | null, 
    field: string, 
    value: any, 
    isNew?: boolean
  ) => {
    try {
      const fieldName = field as keyof GWD
      
      if (isNew) {
        // Type the diffKey properly
        const diffKey = Object.keys(differences).find(key => {
          const diffs = differences[key]
          return diffs[0]?.isNew && diffs[0]?.gwd_number === differences[String(gwd_id || 0)]?.[0]?.gwd_number
        })

        if (!diffKey || !differences[diffKey]) {
          throw new Error('Could not find fields for new record')
        }

        const currentDiffs = differences[diffKey]
        
        // Type the reducer properly
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
          if (diffKey) {
            delete newDiffs[diffKey]
          }
          return newDiffs
        })
      } else {
        // Handle existing record update
        const { data, error } = await supabase
          .from('gwds')
          .update({ [fieldName]: value })
          .eq('gwd_id', gwd_id!)
          .select()

        if (error) throw error
        console.log('Record updated:', data)
      }

      // Remove the resolved difference
      setDifferences(prev => {
        const newDiffs = { ...prev }
        const key = gwd_id ? String(gwd_id) : Object.keys(differences).find(k => 
          differences[k][0]?.gwd_number === differences[String(gwd_id || 0)]?.[0]?.gwd_number
        )
        
        if (key && newDiffs[key]) {
          newDiffs[key] = newDiffs[key].filter(d => d.field !== field)
          if (newDiffs[key].length === 0) {
            delete newDiffs[key]
          }
        }
        return newDiffs
      })
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
              <div className="text-red-500">
                {error}
              </div>
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