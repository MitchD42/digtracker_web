import { createClient } from '@/utils/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { GWD, GWDImport } from '@/types/database'
import { headerMap, transformValue, convertImportToGWD, chunk } from './transformUtils'

export class ImportHandler {
  private supabase: SupabaseClient = createClient()
  
  public getSupabaseClient(): SupabaseClient {
    return this.supabase
  }

  public transformHeader(header: string): string {
    const cleaned = header.trim()
    return headerMap[cleaned] || cleaned.toLowerCase().replace(/\s+/g, '_')
  }

  public transformValue(value: string | null | undefined, field: string): any {
    if (value === null || value === undefined) {
      return field === 'status' ? 'Not Started' : null;
    }

    if (field === '_ignore_') return undefined
    if (value === '') return field === 'status' ? 'Not Started' : null

    return transformValue(value, field)
  }

  private convertImportToGWD(importedGWD: GWDImport): Partial<GWD> {
    return convertImportToGWD(importedGWD)
  }

  private chunk<T>(array: T[], size: number): T[][] {
    return chunk(array, size)
  }

  async processImportedData(data: any[]): Promise<{
    importedGWDs: GWDImport[];
    existingGWDs: GWD[];
    differences: any;
  }> {
    console.group('📥 CSV Import Process')
    
    // Clean and validate the data
    const validData = data
        .map(row => {
            try {
                return this.cleanImportData(row)
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                console.warn('Skipping invalid row:', errorMessage)
                return null
            }
        })
        .filter((row): row is GWDImport => row !== null)

    if (validData.length === 0) {
        throw new Error('No valid rows found in import file')
    }

    console.log('Data validation:', {
        originalCount: data.length,
        validCount: validData.length,
        skippedCount: data.length - validData.length
    })

    // Store in gwds_import first
    if (validData.length > 0) {
      // First clear the import table
      await this.supabase.from('gwds_import').delete().neq('gwd_id', 0)
      
      // Then insert new data
      const chunks = this.chunk(validData, 100)
      for (const chunk of chunks) {
        const { error: insertError } = await this.supabase
          .from('gwds_import')
          .insert(chunk)
          .select()

        if (insertError) throw insertError
      }
    }

    // Get imported records with digtracker_id
    const { data: importedRecords, error: importFetchError } = await this.supabase
      .from('gwds_import')
      .select('*')
      .filter('digtracker_id', 'not.is', null)

    if (importFetchError) throw importFetchError

    // Get existing records that match digtracker_ids
    const digTrackerIds = importedRecords
      ?.map((record: GWDImport) => record.digtracker_id)
      .filter((id: number | null) => id != null)

    const { data: existingGWDs, error: gwdFetchError } = await this.supabase
      .from('gwds')
      .select('*')
      .in('digtracker_id', digTrackerIds || [])

    if (gwdFetchError) throw gwdFetchError

    // Auto-insert new records
    const newRecords = importedRecords
      ?.filter((record: GWDImport) => 
        !existingGWDs?.some((existing: GWD) => 
          existing.digtracker_id === record.digtracker_id
        )
      )
      .map((record: GWDImport) => this.convertImportToGWD(record))

    if (newRecords && newRecords.length > 0) {
      console.log('Auto-inserting new records:', {
        count: newRecords.length,
        sample: newRecords[0]
      })

      const { error: insertError } = await this.supabase
        .from('gwds')
        .insert(newRecords)
        .select()

      if (insertError) throw insertError
      console.log(`✅ Inserted ${newRecords.length} new records`)
    }

    return {
      importedGWDs: importedRecords || [],
      existingGWDs: existingGWDs || [],
      differences: this.compareGWDs(existingGWDs || [], importedRecords || [])
    }
  }

  private cleanImportData(row: any): GWDImport {
    const cleaned: Partial<GWDImport> = {}
    
    // Define allowed fields based on database schema
    const allowedFields = [
        'gwd_number',
        'system',
        'pipeline',
        'status',
        'execution_year',
        'dig_name',
        'inspection_provider',
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
        'actual_inspection_length',
        'digtracker_id'
    ]

    // Check for digtracker_id (required)
    const digtrackerId = row.digtracker_id
    if (digtrackerId === null || digtrackerId === undefined || digtrackerId === '') {
        console.warn('Skipping row due to missing or invalid ID:', row)
        throw new Error('ID is mandatory')
    }
    cleaned.digtracker_id = this.transformValue(String(digtrackerId), 'digtracker_id')

    // Check for GWD number (required)
    const gwdNumber = row.gwd_number
    if (gwdNumber === null || gwdNumber === undefined || gwdNumber === '') {
        console.warn('Skipping row due to missing gwd_number:', row)
        throw new Error('GWD number is mandatory')
    }
    cleaned.gwd_number = this.transformValue(String(gwdNumber), 'gwd_number')

    // Process remaining fields
    Object.keys(row).forEach(field => {
        if (allowedFields.includes(field) && field !== 'digtracker_id' && field !== 'gwd_number') {
            cleaned[field as keyof GWDImport] = this.transformValue(row[field], field)
        }
    })

    return cleaned as GWDImport
  }

  async handleResolution(
    differences: {
      [key: string]: {
        gwd_id: number | null;
        gwd_number: number;
        field: string;
        existing: any;
        imported: any;
        isNew?: boolean;
        record?: GWDImport;
      }[]
    },
    gwd_id: number | null,
    field: string,
    value: any,
    isNew?: boolean
  ) {
    if (isNew) {
      // Handle new record insertion
      const diffKey = Object.keys(differences).find(key => {
        const diffs = differences[key]
        return diffs[0]?.isNew && diffs[0]?.gwd_number === differences[String(gwd_id || 0)]?.[0]?.gwd_number
      })

      if (!diffKey || !differences[diffKey]) {
        throw new Error('Could not find fields for new record')
      }

      const currentDiffs = differences[diffKey]
      const newRecord = {
        ...currentDiffs.reduce((acc, diff) => ({
          ...acc,
          [diff.field]: diff.imported
        }), {}),
        [field]: value
      }

      console.log('Inserting new record:', newRecord)
      const { data, error } = await this.supabase
        .from('gwds')
        .insert([newRecord])
        .select()

      if (error) throw error
      console.log('New record inserted:', data)

    } else {
      // Handle existing record update
      const { data, error } = await this.supabase
        .from('gwds')
        .update({ [field]: value })
        .eq('gwd_id', gwd_id!)
        .select()

      if (error) throw error
      console.log('Record updated:', data)
    }

    // Return updated differences
    return this.updateDifferences(differences, gwd_id, field)
  }

  private updateDifferences(differences: any, gwd_id: number | null, field: string) {
    const newDiffs = { ...differences }
    const key = gwd_id ? String(gwd_id) : Object.keys(differences).find(k => 
      differences[k][0]?.gwd_number === differences[String(gwd_id || 0)]?.[0]?.gwd_number
    )
    
    if (key && newDiffs[key]) {
      newDiffs[key] = newDiffs[key].filter((d: any) => d.field !== field)
      if (newDiffs[key].length === 0) {
        delete newDiffs[key]
      }
    }
    return newDiffs
  }

  public compareGWDs(existing: GWD[], imported: GWDImport[]): {
    [key: string]: {
      gwd_id: number | null;
      gwd_number: number;
      field: string;
      existing: any;
      imported: any;
      isNew?: boolean;
    }[]
  } {
    console.group('🔍 compareGWDs called')
    
    const diffs: {[key: string]: any[]} = {};
    const skipFields = ['gwd_id', 'created_date', 'import_date', 'sync_status']

    // Create a map of existing records by digtracker_id
    const existingByDigTrackerId = new Map(
        existing.map(gwd => [gwd.digtracker_id, gwd])
    )

    imported.forEach(importedGWD => {
        // Always match on digtracker_id, not gwd_number
        const existingGWD = existingByDigTrackerId.get(importedGWD.digtracker_id)
        
        if (!existingGWD) {
            // New record - create a unique key using digtracker_id
            const key = `new_${importedGWD.digtracker_id}`
            diffs[key] = Object.keys(importedGWD)
                .filter(field => 
                    !skipFields.includes(field) && 
                    importedGWD[field as keyof GWDImport] !== null
                )
                .map(field => ({
                    gwd_id: null,
                    gwd_number: importedGWD.gwd_number,
                    field,
                    existing: null,
                    imported: importedGWD[field as keyof GWDImport],
                    isNew: true
                }))
        } else {
            // Existing record - use gwd_id as key
            const key = String(existingGWD.gwd_id)
            const differences = Object.keys(importedGWD)
                .filter(field => 
                    !skipFields.includes(field) &&
                    importedGWD[field as keyof GWDImport] !== null &&
                    importedGWD[field as keyof GWDImport] !== existingGWD[field as keyof GWD]
                )
                .map(field => ({
                    gwd_id: existingGWD.gwd_id,
                    gwd_number: existingGWD.gwd_number,
                    field,
                    existing: existingGWD[field as keyof GWD],
                    imported: importedGWD[field as keyof GWDImport]
                }))

            if (differences.length > 0) {
                diffs[key] = differences
            }
        }
    })

    console.groupEnd()
    return diffs
  }
} 