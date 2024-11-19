export interface Pipeline {
  pipeline_id: number
  pipeline_name: string
  system_id: number
  created_date: string
}

export interface AFE {
  afe_id: number
  afe_number: string
  description: string | null
  budget: number
  status: AFEStatus
  system_id: number
  current_costs: number
  created_date: string
  notes: string | null
}

export interface AFEWithPipelines extends AFE {
  system?: {
    system_id: number
    system_name: string
  }
  afe_pipelines?: AFEPipeline[]
}

export interface GWD {
  gwd_id: number
  digtracker_id: number | null
  gwd_number: number
  afe_id: number | null
  system: string | null
  pipeline: string | null
  status: 'CLEIR Approved' | 'Dig Cancelled' | 'Dig Completed' | 'Dig Postponed' | 'Dig Report Received' | 'Site Selected' | 'With CLEIR'
  notes: string | null
  initial_budget: number
  land_cost: number
  dig_cost: number
  b_sleeve: number
  petro_sleeve: number
  composite: number
  recoat: number
  created_date: string
  execution_year?: number | null
  dig_name?: string | null
  inspection_provider?: string | null
  ili_analysis?: string | null
  dig_criteria?: string | null
  inspection_start_relative?: number | null
  inspection_end_relative?: number | null
  inspection_length?: number | null
  target_features?: string | null
  smys?: number | null
  mop?: number | null
  design_factor?: number | null
  class_location?: number | null
  class_location_factor?: number | null
  p_failure?: number | null
  latitude?: number | null
  longitude?: number | null
  program_engineer?: string | null
  program_engineer_comments?: string | null
  project_engineer?: string | null
  post_execution_comments?: string | null
  last_updated?: string | null
  created_by?: string | null
  inspection_completion_date?: string | null
  actual_inspection_start?: number | null
  actual_inspection_start_relative?: number | null
  actual_inspection_end_relative?: number | null
  actual_inspection_length?: number | null
}

export interface Vendor {
  vendor_id: number
  vendor_name: string
  created_date: string
}

export interface PurchaseOrder {
  po_id: number
  po_number: string
  afe_id: number
  vendor_id: number
  initial_value: number
  status: 'Open' | 'Closed'
  created_date: string
  notes: string | null
}

export interface ChangeOrder {
  co_id: number
  po_id: number
  co_number: string
  value: number
  description: string | null
  created_date: string
}

export interface ChecklistTemplate {
  template_id: number
  name: string
  version: number | null
  active: boolean
  created_date: string
}

export interface TemplateItem {
  item_id: number
  template_id: number
  description: string
  created_date: string
}

export interface ChecklistInstance {
  instance_id: number
  template_id: number
  gwd_id: number | null
  afe_id: number | null
  completion: number
  created_date: string
  last_updated: string
}

export interface CompletedItem {
  instance_id: number
  item_id: number
  completed: boolean
  priority: boolean
  completed_date: string
}

// Summary view type
export interface AFECostSummary {
  afe_id: number
  afe_number: string
  budget: number
  total_gwd_costs: number
  gwd_count: number
  completed_gwds: number
}

// Join types for related data
export interface GWDWithAFE extends GWD {
  afe: AFE | null
}

export interface PurchaseOrderWithDetails extends PurchaseOrder {
  vendor: Vendor
  afe: AFE
  change_orders: ChangeOrder[]
}

export interface ChecklistInstanceWithDetails extends ChecklistInstance {
  template: ChecklistTemplate
  completed_items: CompletedItem[]
  gwd?: GWD
  afe?: AFE
}

export interface AFEPipeline {
  afe_pipeline_id: number
  afe_id: number
  pipeline_id: number
  created_date: string
  pipeline: Pipeline
}

export interface POWithDetails extends PurchaseOrder {
  vendor: Vendor
  afe: AFE
  change_orders: ChangeOrder[]
  total_value: number
}

export interface System {
  system_id: number
  system_name: string
  created_date: string
}

export type AFEStatus = 'Draft' | 'Active' | 'Complete' | 'Cancelled'

export interface Material {
  material_id: number
  vendor_id: number
  price: number
  length: number | null
  vendor_ref_id: string | null
  notes: string | null
  created_date: string
  vendor: Vendor
}

export type RepairType = 'Recoat' | 'Petro-Sleeve' | 'B-Sleeve' | 'Composite'

export interface ConstructionSupervisor {
  cs_id: number
  name: string
  created_date: string
}

export interface CSWithDetails extends ConstructionSupervisor {
  purchase_orders: {
    cs_po_id: number
    cs_id: number
    po_id: number
    work_start: string
    work_end: string
    po: POWithDetails
  }[]
  gwds: {
    cs_gwd_id: number
    cs_id: number
    gwd_id: number
    work_start: string
    work_end: string
    gwd: GWDWithAFE
  }[]
}

export interface CSPO {
  cs_po_id: number
  cs_id: number
  po_id: number
  work_start: string
  work_end: string
  created_date: string
}

export interface CSGWD {
  cs_gwd_id: number
  cs_id: number
  gwd_id: number
  work_start: string
  work_end: string
  created_date: string
}

export interface GWDImport extends Omit<GWD, 'gwd_id'> {
  gwd_id?: number;
  import_date?: string;
  sync_status?: 'pending' | 'processed' | 'error';
}