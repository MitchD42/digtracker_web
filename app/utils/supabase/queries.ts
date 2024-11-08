import { createClient } from '@/utils/supabase/client'
import { 
  System, 
  AFE,
  AFECostSummary, 
  GWDWithAFE, 
  PurchaseOrderWithDetails,
  ChecklistTemplate,
  ChecklistInstanceWithDetails,
  Vendor,
  ChangeOrder,
  AFEWithPipelines
} from '@/types/database'

// Create a single supabase client instance
const getSupabase = async () => {
  return await createClient()
}

// Systems
export const getSystems = async (): Promise<System[]> => {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('systems')
      .select('*')
      .order('system_name')

    if (error) {
      console.log('No systems found:', error.message)
      return []
    }
    return data || []
  } catch (error) {
    console.log('Error fetching systems:', error)
    return []
  }
}

// AFEs
export const getAFECostSummary = async (afeId: number): Promise<AFECostSummary> => {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('afe_cost_summary_view')
    .select('*')
    .eq('afe_id', afeId)
    .single()

  if (error) throw error
  return data
}

export const getAFEs = async (): Promise<AFEWithPipelines[]> => {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('afes')
      .select(`
        *,
        pipelines:afe_pipelines!left (
          afe_pipeline_id,
          afe_id,
          pipeline_id,
          created_date,
          pipeline:pipelines!left (
            pipeline_id,
            pipeline_name,
            system_id,
            created_date
          )
        )
      `)
      .order('created_date', { ascending: false })

    if (error) {
      console.log('No AFEs found:', error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.log('Error fetching AFEs:', error)
    return []
  }
}

// GWDs
export const getGWDsByAFE = async (afeId: number): Promise<GWDWithAFE[]> => {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('gwds')
    .select(`
      *,
      afe:afes (*)
    `)
    .eq('afe_id', afeId)
    .order('gwd_number')

  if (error) throw error
  return data || []
};

// Vendors
export const getVendors = async (): Promise<Vendor[]> => {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .order('vendor_name')

  if (error) throw error
  return data
}

// Purchase Orders
export const getPOsByAFE = async (afeId: number): Promise<PurchaseOrderWithDetails[]> => {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      vendor:vendors (*),
      afe:afes (*),
      change_orders (*)
    `)
    .eq('afe_id', afeId)
    .order('created_date', { ascending: false })

  if (error) throw error
  return data || []
};

// Change Orders
export const getChangeOrdersForPO = async (poId: number): Promise<ChangeOrder[]> => {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('change_orders')
    .select('*')
    .eq('po_id', poId)

  if (error) throw error
  return data
}

// Checklists
export const getChecklistTemplates = async (): Promise<ChecklistTemplate[]> => {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('checklist_templates')
    .select('*')
    .order('template_name')

  if (error) throw error
  return data || []
}

export const getChecklistInstancesForGWD = async (gwdId: number): Promise<ChecklistInstanceWithDetails[]> => {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('checklist_instances')
    .select(`
      *,
      template:checklist_templates (*)
    `)
    .eq('gwd_id', gwdId)

  if (error) throw error
  return data || []
} 