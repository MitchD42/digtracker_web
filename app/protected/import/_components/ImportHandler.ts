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
      .map(row => this.cleanImportData(row))
      .filter(row => {
        if (!row.gwd_number) {
          console.warn('Skipping row due to missing gwd_number:', row)
          return false
        }
        return true
      })

    console.log('Data validation:', {
      originalCount: data.length,
      validCount: validData.length,
      skippedCount: data.length - validData.length
    })

    // Store in gwds_import first
    if (validData.length > 0) {
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
      if (field in row) {
        const rawValue = row[field]
        cleaned[field as keyof GWDImport] = this.transformValue(
          rawValue !== null && rawValue !== undefined ? String(rawValue) : rawValue,
          field
        )
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

    console.log('Comparison complete:', {
      diffKeys: Object.keys(diffs),
      diffCount: Object.keys(diffs).length,
      sample: Object.entries(diffs)[0]
    })
    console.groupEnd()

    return diffs
  }
} 