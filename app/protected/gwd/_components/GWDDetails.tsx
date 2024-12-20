import { useState, useMemo } from 'react'
import { GWDWithAFE, AFEWithPipelines } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'
import { X, Edit2, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { UI } from '@/lib/constants/ui'
import { GWDStatus, GWD_STATUS_OPTIONS } from '@/lib/constants/gwd-statuses'

interface GWDDetailsProps {
  gwd: GWDWithAFE
  afes: AFEWithPipelines[]
  onClose: () => void
  onUpdate: () => void
}

interface EditableGWD extends Omit<GWDWithAFE, 'status'> {
  status: GWDStatus;
  execution_year?: number | null;
  dig_name?: string | null;
  inspection_provider?: string | null;
  ili_analysis?: string | null;
  dig_criteria?: string | null;
  inspection_start_relative?: number | null;
  inspection_end_relative?: number | null;
  inspection_length?: number | null;
  target_features?: string | null;
  smys?: number | null;
  mop?: number | null;
  design_factor?: number | null;
  class_location?: number | null;
  class_location_factor?: number | null;
  p_failure?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  program_engineer?: string | null;
  program_engineer_comments?: string | null;
  project_engineer?: string | null;
  post_execution_comments?: string | null;
  last_updated?: string | null;
  created_by?: string | null;
  inspection_completion_date?: string | null;
  actual_inspection_start?: number | null;
  actual_inspection_start_relative?: number | null;
  actual_inspection_end_relative?: number | null;
  actual_inspection_length?: number | null;
}

export default function GWDDetails({ gwd, afes, onClose, onUpdate }: GWDDetailsProps) {
  const supabase = createClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editedGWD, setEditedGWD] = useState<EditableGWD>(gwd)
  const [showFullDetails, setShowFullDetails] = useState(false)

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('gwds')
        .update({
          afe_id: editedGWD.afe_id,
          system: editedGWD.system,
          pipeline: editedGWD.pipeline,
          status: editedGWD.status,
          initial_budget: editedGWD.initial_budget,
          land_cost: editedGWD.land_cost,
          dig_cost: editedGWD.dig_cost,
          b_sleeve: editedGWD.b_sleeve,
          petro_sleeve: editedGWD.petro_sleeve,
          composite: editedGWD.composite,
          recoat: editedGWD.recoat,
          notes: editedGWD.notes,
          execution_year: editedGWD.execution_year,
          dig_name: editedGWD.dig_name,
          inspection_provider: editedGWD.inspection_provider,
          ili_analysis: editedGWD.ili_analysis,
          dig_criteria: editedGWD.dig_criteria,
          inspection_start_relative: editedGWD.inspection_start_relative,
          inspection_end_relative: editedGWD.inspection_end_relative,
          inspection_length: editedGWD.inspection_length,
          target_features: editedGWD.target_features,
          smys: editedGWD.smys,
          mop: editedGWD.mop,
          design_factor: editedGWD.design_factor,
          class_location: editedGWD.class_location,
          class_location_factor: editedGWD.class_location_factor,
          p_failure: editedGWD.p_failure,
          latitude: editedGWD.latitude,
          longitude: editedGWD.longitude,
          program_engineer: editedGWD.program_engineer,
          program_engineer_comments: editedGWD.program_engineer_comments,
          project_engineer: editedGWD.project_engineer,
          post_execution_comments: editedGWD.post_execution_comments,
        })
        .eq('gwd_id', gwd.gwd_id)

      if (error) throw error

      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating GWD:', error)
      alert('Failed to update GWD')
    }
  }

  const handleAFEChange = (afeId: number) => {
    const selectedAFE = afes.find(afe => afe.afe_id === afeId)
    if (selectedAFE) {
      console.log('Selected AFE:', selectedAFE)
      setEditedGWD(prev => ({
        ...prev,
        afe_id: afeId,
        afe: selectedAFE,
        system: selectedAFE.system?.system_name || '',
        pipeline: ''
      }))
    }
  }

  const availablePipelines = useMemo(() => {
    const selectedAFE = afes.find(afe => afe.afe_id === editedGWD.afe_id)
    return selectedAFE?.afe_pipelines?.map(ap => ap.pipeline) || []
  }, [afes, editedGWD.afe_id])

  return (
    <div className={UI.containers.section}>
      <div className="flex justify-between items-start">
        <div>
          <h2 className={UI.text.title + " text-2xl"}>GWD #{gwd.gwd_number}</h2>
          <p className={UI.text.subtitle}>AFE: {gwd.afe?.afe_number}</p>
        </div>
        <div className="space-x-2">
          {isEditing ? (
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className={UI.text.label}>Status</Label>
              {isEditing ? (
                <select
                  className={UI.inputs.select}
                  value={editedGWD.status}
                  onChange={e => setEditedGWD((prev: EditableGWD) => ({
                    ...prev,
                    status: e.target.value as GWDStatus
                  }))}
                >
                  {GWD_STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              ) : (
                <p className={UI.text.subtitle}>{editedGWD.status}</p>
              )}
            </div>

            <div>
              <Label className={UI.text.label}>AFE</Label>
              {isEditing ? (
                <select
                  className={UI.inputs.select}
                  value={editedGWD.afe_id || ''}
                  onChange={(e) => handleAFEChange(Number(e.target.value))}
                >
                  <option value="">Select AFE</option>
                  {afes.map(afe => (
                    <option key={afe.afe_id} value={afe.afe_id}>
                      {afe.afe_number}
                    </option>
                  ))}
                </select>
              ) : (
                <p className={UI.text.subtitle}>{editedGWD.afe?.afe_number || 'No AFE'}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={UI.text.label}>System</Label>
                <p className={UI.text.subtitle}>{editedGWD.system || 'N/A'}</p>
              </div>
              <div>
                <Label className={UI.text.label}>Pipeline</Label>
                {isEditing ? (
                  <select
                    className={UI.inputs.select}
                    value={editedGWD.pipeline || ''}
                    onChange={(e) => setEditedGWD(prev => ({
                      ...prev,
                      pipeline: e.target.value
                    }))}
                  >
                    <option value="">Select Pipeline</option>
                    {availablePipelines.map(pipeline => (
                      <option key={pipeline.pipeline_id} value={pipeline.pipeline_name}>
                        {pipeline.pipeline_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className={UI.text.subtitle}>{editedGWD.pipeline || 'N/A'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Costs & Repairs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Costs</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Initial Budget</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedGWD.initial_budget || ''}
                      onChange={e => setEditedGWD(prev => ({
                        ...prev,
                        initial_budget: parseFloat(e.target.value) || 0
                      }))}
                    />
                  ) : (
                    <p className="text-lg">${editedGWD.initial_budget?.toLocaleString() || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Land Cost</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedGWD.land_cost || ''}
                      onChange={e => setEditedGWD(prev => ({
                        ...prev,
                        land_cost: parseFloat(e.target.value) || 0
                      }))}
                    />
                  ) : (
                    <p className="text-lg">${editedGWD.land_cost?.toLocaleString() || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Dig Cost</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedGWD.dig_cost || ''}
                      onChange={e => setEditedGWD(prev => ({
                        ...prev,
                        dig_cost: parseFloat(e.target.value) || 0
                      }))}
                    />
                  ) : (
                    <p className="text-lg">${editedGWD.dig_cost?.toLocaleString() || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Total Cost</Label>
                  <p className="text-lg">${((editedGWD.land_cost || 0) + (editedGWD.dig_cost || 0)).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-2">Repair Counts</h3>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>B-Sleeve Count</Label>
                    <Input
                      type="number"
                      value={editedGWD.b_sleeve}
                      onChange={e => setEditedGWD(prev => ({
                        ...prev,
                        b_sleeve: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Petro-Sleeve Count</Label>
                    <Input
                      type="number"
                      value={editedGWD.petro_sleeve}
                      onChange={e => setEditedGWD(prev => ({
                        ...prev,
                        petro_sleeve: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Composite Count</Label>
                    <Input
                      type="number"
                      value={editedGWD.composite}
                      onChange={e => setEditedGWD(prev => ({
                        ...prev,
                        composite: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Recoat Count</Label>
                    <Input
                      type="number"
                      value={editedGWD.recoat}
                      onChange={e => setEditedGWD(prev => ({
                        ...prev,
                        recoat: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>B-Sleeve: {editedGWD.b_sleeve}</p>
                  <p>Petro-Sleeve: {editedGWD.petro_sleeve}</p>
                  <p>Composite: {editedGWD.composite}</p>
                  <p>Recoat: {editedGWD.recoat}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Input
              value={editedGWD.notes || ''}
              onChange={e => setEditedGWD((prev: EditableGWD) => ({
                ...prev,
                notes: e.target.value
              }))}
            />
          ) : (
            <p>{editedGWD.notes || 'No notes'}</p>
          )}
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={() => setShowFullDetails(!showFullDetails)}
        className="w-full"
      >
        {showFullDetails ? (
          <>
            <ChevronUp className="h-4 w-4 mr-2" />
            Hide Full Details
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-2" />
            Show Full Details
          </>
        )}
      </Button>

      {showFullDetails && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Inspection Provider</Label>
                {isEditing ? (
                  <Input
                    value={editedGWD.inspection_provider || ''}
                    onChange={e => setEditedGWD(prev => ({
                      ...prev,
                      inspection_provider: e.target.value
                    }))}
                  />
                ) : (
                  <p className="text-lg">{editedGWD.inspection_provider || 'N/A'}</p>
                )}
              </div>

              <div>
                <Label>Inspection Completion Date</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editedGWD.inspection_completion_date || ''}
                    onChange={e => setEditedGWD(prev => ({
                      ...prev,
                      inspection_completion_date: e.target.value
                    }))}
                  />
                ) : (
                  <p className="text-lg">{editedGWD.inspection_completion_date || 'N/A'}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Planned Start (m)</Label>
                  <p className="text-lg">{editedGWD.inspection_start_relative || 'N/A'}</p>
                </div>
                <div>
                  <Label>Planned End (m)</Label>
                  <p className="text-lg">{editedGWD.inspection_end_relative || 'N/A'}</p>
                </div>
                <div>
                  <Label>Planned Length (m)</Label>
                  <p className="text-lg">{editedGWD.inspection_length || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Actual Start</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedGWD.actual_inspection_start || ''}
                      onChange={e => setEditedGWD(prev => ({
                        ...prev,
                        actual_inspection_start: parseFloat(e.target.value)
                      }))}
                    />
                  ) : (
                    <p className="text-lg">{editedGWD.actual_inspection_start || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Actual Start Relative (m)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedGWD.actual_inspection_start_relative || ''}
                      onChange={e => setEditedGWD(prev => ({
                        ...prev,
                        actual_inspection_start_relative: parseFloat(e.target.value)
                      }))}
                    />
                  ) : (
                    <p className="text-lg">{editedGWD.actual_inspection_start_relative || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Actual End Relative (m)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedGWD.actual_inspection_end_relative || ''}
                      onChange={e => setEditedGWD(prev => ({
                        ...prev,
                        actual_inspection_end_relative: parseFloat(e.target.value)
                      }))}
                    />
                  ) : (
                    <p className="text-lg">{editedGWD.actual_inspection_end_relative || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Actual Length (m)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedGWD.actual_inspection_length || ''}
                      onChange={e => setEditedGWD(prev => ({
                        ...prev,
                        actual_inspection_length: parseFloat(e.target.value)
                      }))}
                    />
                  ) : (
                    <p className="text-lg">{editedGWD.actual_inspection_length || 'N/A'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={UI.text.label}>SMYS</Label>
                  <p className={UI.text.subtitle}>{editedGWD.smys || 'N/A'}</p>
                </div>
                <div>
                  <Label className={UI.text.label}>MOP</Label>
                  <p className={UI.text.subtitle}>{editedGWD.mop || 'N/A'}</p>
                </div>
                <div>
                  <Label className={UI.text.label}>Design Factor</Label>
                  <p className={UI.text.subtitle}>{editedGWD.design_factor || 'N/A'}</p>
                </div>
                <div>
                  <Label className={UI.text.label}>Class Location</Label>
                  <p className={UI.text.subtitle}>{editedGWD.class_location || 'N/A'}</p>
                </div>
                <div>
                  <Label className={UI.text.label}>Class Location Factor</Label>
                  <p className={UI.text.subtitle}>{editedGWD.class_location_factor || 'N/A'}</p>
                </div>
                <div>
                  <Label className={UI.text.label}>P-Failure</Label>
                  <p className={UI.text.subtitle}>{editedGWD.p_failure || 'N/A'}</p>
                </div>
              </div>

              <div>
                <Label className={UI.text.label}>Target Features</Label>
                <p className={UI.text.subtitle}>{editedGWD.target_features || 'N/A'}</p>
              </div>

              <div>
                <Label className={UI.text.label}>Dig Criteria</Label>
                <p className={UI.text.subtitle}>{editedGWD.dig_criteria || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={UI.text.label}>Latitude</Label>
                  <p className={UI.text.subtitle}>{editedGWD.latitude || 'N/A'}</p>
                </div>
                <div>
                  <Label className={UI.text.label}>Longitude</Label>
                  <p className={UI.text.subtitle}>{editedGWD.longitude || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personnel & Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className={UI.text.label}>Program Engineer</Label>
                <p className={UI.text.subtitle}>{editedGWD.program_engineer || 'N/A'}</p>
              </div>

              <div>
                <Label className={UI.text.label}>Program Engineer Comments</Label>
                <p className={UI.text.subtitle}>{editedGWD.program_engineer_comments || 'N/A'}</p>
              </div>

              <div>
                <Label className={UI.text.label}>Project Engineer</Label>
                {isEditing ? (
                  <Input
                    value={editedGWD.project_engineer || ''}
                    onChange={e => setEditedGWD(prev => ({
                      ...prev,
                      project_engineer: e.target.value
                    }))}
                  />
                ) : (
                  <p className={UI.text.subtitle}>{editedGWD.project_engineer || 'N/A'}</p>
                )}
              </div>

              <div>
                <Label className={UI.text.label}>Post Execution Comments</Label>
                {isEditing ? (
                  <Input
                    value={editedGWD.post_execution_comments || ''}
                    onChange={e => setEditedGWD(prev => ({
                      ...prev,
                      post_execution_comments: e.target.value
                    }))}
                  />
                ) : (
                  <p className={UI.text.subtitle}>{editedGWD.post_execution_comments || 'N/A'}</p>
                )}
              </div>

              <div>
                <Label className={UI.text.label}>Last Updated</Label>
                <p className={UI.text.subtitle}>{editedGWD.last_updated || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 