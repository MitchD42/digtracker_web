import { GWD, GWDImport } from '@/types/database'

export type GWDKeys = keyof GWD;

export function chunk<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  )
}

export const headerMap: { [key: string]: string } = {
  'ID': 'digtracker_id',
  'Id': 'digtracker_id',
  'id': 'digtracker_id',
  'Digtracker ID': 'digtracker_id',
  'DigTracker ID': 'digtracker_id',
  'Digtracker Id': 'digtracker_id',
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

export const transformValue = (value: string | null | undefined, field: string): any => {
  // Log incoming values for debugging
  if (field === 'digtracker_id') {
    console.debug('transformValue for digtracker_id:', { raw: value, type: typeof value })
  }

  // Early returns for null/undefined/empty
  if (value === null || value === undefined) {
    return null;
  }
  if (field === '_ignore_') return undefined
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

  // For integer fields, be more forgiving with the input
  if (integerFields.includes(field)) {
    // Remove any non-numeric characters and whitespace
    const cleaned = value.toString().trim().replace(/[^\d-]/g, '')
    if (cleaned === '') return null
    
    const num = parseInt(cleaned)
    if (isNaN(num)) {
      console.warn(`Failed to parse integer for ${field}:`, { original: value, cleaned })
      return null
    }
    return num
  }

  if (numericFields.includes(field)) {
    const num = parseFloat(value)
    return isNaN(num) ? null : num
  }
  
  if (textFields.includes(field)) {
    return value.trim()
  }
  
  const dateFields = ['inspection_completion_date']
  if (dateFields.includes(field)) {
    return value ? value : null
  }
  
  const timestampFields = ['last_updated', 'created_date']
  if (timestampFields.includes(field)) {
    return value ? new Date(value).toISOString() : null
  }
  
  return value
}

export const convertImportToGWD = (importedGWD: GWDImport): Partial<GWD> => {
  type OmittedFields = 'gwd_id' | 'import_date' | 'sync_status';
  const { gwd_id, import_date, sync_status, ...rest } = importedGWD as 
    GWDImport & Record<OmittedFields, any>;
  return rest;
} 