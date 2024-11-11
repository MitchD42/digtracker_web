import { useState } from 'react'
import { 
  AFE, 
  GWDWithAFE, 
  PurchaseOrderWithDetails, 
  AFEPipeline, 
  AFEWithPipelines,
  System,
  AFEStatus,
  Pipeline,
  ChangeOrder
} from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'
import { X, Edit2, Save, AlertTriangle, FileText, ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { UI } from '@/lib/constants/ui'

interface AFEDetailsProps {
  afe: AFEWithPipelines
  gwds: GWDWithAFE[]
  purchaseOrders: PurchaseOrderWithDetails[]
  systems: System[]
  onClose: () => void
  onUpdate: () => void
}

interface EditedAFE extends AFEWithPipelines {
  afe_pipelines: AFEPipeline[]
}

export default function AFEDetails({ 
  afe, 
  gwds, 
  purchaseOrders, 
  systems, 
  onClose, 
  onUpdate 
}: AFEDetailsProps) {
  const supabase = createClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editedAFE, setEditedAFE] = useState<EditedAFE>({
    ...afe,
    afe_pipelines: afe.afe_pipelines || []
  })
  const [newPipeline, setNewPipeline] = useState('')
  const [error, setError] = useState<string | null>(null)

  console.log('AFE Data:', {
    afe,
    afe_pipelines: afe.afe_pipelines,
    pipelinesType: typeof afe.afe_pipelines,
    isArray: Array.isArray(afe.afe_pipelines)
  })

  // Calculate totals
  const totalGWDCosts = gwds.reduce((sum, gwd) => 
    sum + gwd.land_cost + gwd.dig_cost, 0
  )

  const totalPOCosts = purchaseOrders.reduce((sum: number, po) => {
    const changeOrderTotal = po.change_orders.reduce((coSum: number, co: ChangeOrder) => 
      coSum + co.value, 0
    )
    return sum + po.initial_value + changeOrderTotal
  }, 0)

  const totalCosts = totalGWDCosts + totalPOCosts
  const isOverBudget = totalCosts > editedAFE.budget

  const handleSave = async () => {
    try {
      const { error: updateError } = await supabase
        .from('afes')
        .update({
          description: editedAFE.description,
          system_id: editedAFE.system_id,
          notes: editedAFE.notes,
          status: editedAFE.status
        })
        .eq('afe_id', editedAFE.afe_id)

      if (updateError) throw updateError

      setIsEditing(false)
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update AFE')
    }
  }

  const addPipeline = async () => {
    if (newPipeline.trim()) {
      try {
        // First, create or get the pipeline from the pipelines table
        const { data: pipelineData, error: pipelineError } = await supabase
          .from('pipelines')
          .select('pipeline_id')
          .eq('pipeline_name', newPipeline.trim())
          .single()

        if (pipelineError && pipelineError.code !== 'PGRST116') {
          throw pipelineError
        }

        let pipeline_id: number
        if (!pipelineData) {
          // Create new pipeline if it doesn't exist
          const { data: newPipelineData, error: createError } = await supabase
            .from('pipelines')
            .insert({
              pipeline_name: newPipeline.trim(),
              system_id: editedAFE.system_id,
              created_date: new Date().toISOString()
            })
            .select('pipeline_id')
            .single()

          if (createError) throw createError
          pipeline_id = newPipelineData.pipeline_id
        } else {
          pipeline_id = pipelineData.pipeline_id
        }

        // Then create the AFE-Pipeline relationship
        const { data, error } = await supabase
          .from('afe_pipelines')
          .insert({
            afe_id: editedAFE.afe_id,
            pipeline_id: pipeline_id,
            created_date: new Date().toISOString()
          })
          .select(`
            afe_pipeline_id,
            afe_id,
            pipeline_id,
            created_date,
            pipelines (
              pipeline_id,
              pipeline_name,
              system_id,
              created_date
            )
          `)
          .single()

        if (error) throw error

        if (!data.pipelines?.[0]) {
          throw new Error('No pipeline data returned from query')
        }

        const newPipelineEntry: AFEPipeline = {
          afe_pipeline_id: data.afe_pipeline_id,
          afe_id: data.afe_id,
          pipeline_id: data.pipeline_id,
          created_date: data.created_date,
          pipeline: data.pipelines[0]
        }

        setEditedAFE(prev => ({
          ...prev,
          afe_pipelines: [...(prev.afe_pipelines || []), newPipelineEntry]
        }))
        
        setNewPipeline('')
      } catch (err) {
        console.error('Error adding pipeline:', err)
        setError('Failed to add pipeline')
      }
    }
  }

  const removePipeline = async (afePipelineId: number) => {
    try {
      const { error } = await supabase
        .from('afe_pipelines')
        .delete()
        .eq('afe_pipeline_id', afePipelineId)

      if (error) throw error

      setEditedAFE(prev => ({
        ...prev,
        afe_pipelines: prev.afe_pipelines?.filter(p => p.afe_pipeline_id !== afePipelineId) || []
      }))
    } catch (err) {
      console.error('Error removing pipeline:', err)
      setError('Failed to remove pipeline')
    }
  }

  const getSystemName = (systemId: number) => {
    const system = systems.find(s => s.system_id === systemId)
    return system ? system.system_name : 'Unknown System'
  }

  return (
    <div className={UI.containers.section}>
      {error && (
        <div className={UI.containers.errorBox}>
          {error}
        </div>
      )}

      <div className="flex justify-between items-start">
        <div>
          <h2 className={UI.text.title}>{editedAFE.afe_number}</h2>
          <p className={UI.text.subtitle}>
            Created: {new Date(editedAFE.created_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} variant="default">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)} variant="default">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button onClick={onClose} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Status</Label>
              {isEditing ? (
                <select
                  className={UI.inputs.select}
                  value={editedAFE.status}
                  onChange={e => setEditedAFE(prev => ({ 
                    ...prev, 
                    status: e.target.value as AFEStatus 
                  }))}
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Complete">Complete</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              ) : (
                <Badge 
                  variant={
                    editedAFE.status === 'Complete' ? 'default' :
                    editedAFE.status === 'Active' ? 'secondary' :
                    editedAFE.status === 'Cancelled' ? 'destructive' : 
                    'secondary'
                  }
                >
                  {editedAFE.status}
                </Badge>
              )}
            </div>

            <div>
              <Label>Description</Label>
              {isEditing ? (
                <Input
                  value={editedAFE.description || ''}
                  onChange={e => setEditedAFE(prev => ({ ...prev, description: e.target.value }))}
                />
              ) : (
                <p className={UI.text.subtitle}>{editedAFE.description || 'No description'}</p>
              )}
            </div>

            <div>
              <Label>System</Label>
              {isEditing ? (
                <select
                  className={UI.inputs.select}
                  value={editedAFE.system_id}
                  onChange={e => setEditedAFE(prev => ({ 
                    ...prev, 
                    system_id: Number(e.target.value) 
                  }))}
                >
                  {systems.map(system => (
                    <option key={system.system_id} value={system.system_id}>
                      {system.system_name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className={UI.text.subtitle}>
                  {getSystemName(editedAFE.system_id)}
                </p>
              )}
            </div>

            <div>
              <Label className={UI.text.label}>Pipelines</Label>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newPipeline}
                      onChange={e => setNewPipeline(e.target.value)}
                      placeholder="Add pipeline"
                    />
                    <Button onClick={addPipeline} type="button">Add</Button>
                  </div>
                  {editedAFE.afe_pipelines?.map((pipelineEntry) => (
                    <div key={pipelineEntry.afe_pipeline_id} 
                      className={`flex justify-between items-center ${UI.listItem.base}`}
                    >
                      <span className={UI.text.subtitle}>{pipelineEntry.pipeline.pipeline_name}</span>
                      <Button variant="ghost" size="sm" onClick={() => removePipeline(pipelineEntry.afe_pipeline_id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {editedAFE.afe_pipelines?.map((pipelineEntry) => (
                    <Badge 
                      key={pipelineEntry.afe_pipeline_id} 
                      variant="secondary"
                    >
                      {pipelineEntry.pipeline.pipeline_name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={UI.text.label}>Budget</Label>
                <p className={UI.statsCard.value}>${editedAFE.budget.toLocaleString()}</p>
              </div>
              <div>
                <Label className={UI.text.label}>Total Costs</Label>
                <p className={`${UI.statsCard.value} ${isOverBudget ? 'text-destructive' : ''}`}>
                  ${totalCosts.toLocaleString()}
                </p>
              </div>
            </div>

            {isOverBudget && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>Over budget by ${(totalCosts - editedAFE.budget).toLocaleString()}</span>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className={UI.text.subtitle + " space-y-2"}>
                <div className="flex justify-between">
                  <span>GWD Costs:</span>
                  <span>${totalGWDCosts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>PO Costs:</span>
                  <span>${totalPOCosts.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related GWDs Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                GWDs
              </CardTitle>
              <span className={UI.text.subtitle}>{gwds.length} total</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gwds.map(gwd => (
                <div key={gwd.gwd_id} 
                  className={`flex justify-between items-start ${UI.listItem.base} ${UI.listItem.interactive}`}
                >
                  <div>
                    <p className={UI.text.title}>GWD #{gwd.gwd_number}</p>
                    <div className={UI.text.subtitle + " space-y-1"}>
                      {gwd.b_sleeve > 0 && (
                        <p>B-Sleeve Count: {gwd.b_sleeve}</p>
                      )}
                      {gwd.petro_sleeve > 0 && (
                        <p>Petro-Sleeve Count: {gwd.petro_sleeve}</p>
                      )}
                      {gwd.composite > 0 && (
                        <p>Composite Count: {gwd.composite}</p>
                      )}
                      {gwd.recoat > 0 && (
                        <p>Recoat Count: {gwd.recoat}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={UI.text.title}>${(gwd.land_cost + gwd.dig_cost).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Purchase Orders Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Purchase Orders
              </CardTitle>
              <span className={UI.text.subtitle}>{purchaseOrders.length} total</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {purchaseOrders.map(po => {
                const poTotal = po.initial_value + 
                  po.change_orders.reduce((sum: number, co: ChangeOrder) => sum + co.value, 0)

                return (
                  <div key={po.po_id} className={`${UI.listItem.base} ${UI.listItem.interactive}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={UI.text.title}>PO #{po.po_number}</p>
                        <p className={UI.text.subtitle}>{po.vendor.vendor_name}</p>
                      </div>
                      <p className={UI.text.title}>${poTotal.toLocaleString()}</p>
                    </div>
                    {po.change_orders.length > 0 && (
                      <div className={UI.text.subtitle + " pl-4 border-l-2 border-border"}>
                        {po.change_orders.map(co => (
                          <div key={co.co_id} className="flex justify-between">
                            <span>CO #{co.co_number}</span>
                            <span>${co.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Input
              value={editedAFE.notes || ''}
              onChange={e => setEditedAFE(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add notes..."
            />
          ) : (
            <p className={UI.text.subtitle}>{editedAFE.notes || 'No notes'}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 