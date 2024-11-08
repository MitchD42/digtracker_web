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
  AFEWithPipelines,
  Material
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
    
    // First, get AFEs with their pipelines
    const { data: afes, error: afesError } = await supabase
      .from('afes')
      .select(`
        *,
        afe_pipelines (
          afe_pipeline_id,
          pipeline_id,
          created_date,
          pipeline:pipelines (*)
        )
      `)
      .order('created_date', { ascending: false })

    if (afesError) {
      console.log('No AFEs found:', afesError.message)
      return []
    }

    // Get GWD costs for each AFE
    const { data: gwdCosts, error: gwdError } = await supabase
      .from('gwds')
      .select('afe_id, land_cost, dig_cost')

    // Calculate total costs for each AFE
    const afesWithCosts = afes?.map(afe => {
      // Sum GWD costs (which already include PO costs)
      const afeGWDCosts = gwdCosts
        ?.filter(gwd => gwd.afe_id === afe.afe_id)
        .reduce((sum, gwd) => sum + (gwd.land_cost || 0) + (gwd.dig_cost || 0), 0) || 0

      // Update current_costs
      return {
        ...afe,
        current_costs: afeGWDCosts
      }
    })

    return afesWithCosts || []
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

export const getGWDs = async (): Promise<GWDWithAFE[]> => {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('gwds')
      .select(`
        *,
        afe:afes (*)
      `)
      .order('gwd_number')

    if (error) {
      console.log('No GWDs found:', error.message)
      return []
    }
    return data || []
  } catch (error) {
    console.log('Error fetching GWDs:', error)
    return []
  }
}

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

// Materials
export const getMaterials = async (): Promise<Material[]> => {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        vendor:vendors (*)
      `)
      .order('created_date', { ascending: false })

    if (error) {
      console.log('No materials found:', error.message)
      return []
    }
    return data || []
  } catch (error) {
    console.log('Error fetching materials:', error)
    return []
  }
} 