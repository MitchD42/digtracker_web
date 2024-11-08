import { useState } from 'react'
import { GWDWithAFE } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'
import { X, Edit2, Save } from 'lucide-react'

interface GWDDetailsProps {
  gwd: GWDWithAFE
  onClose: () => void
  onUpdate: () => void
}

type GWDStatus = 'Complete' | 'In Progress' | 'Cancelled' | 'On Hold' | 'Not Started' | 'Waiting for CLEIR' | 'Ready' | 'No Longer Mine'

interface EditableGWD extends Omit<GWDWithAFE, 'status'> {
  status: GWDStatus
}

export default function GWDDetails({ gwd, onClose, onUpdate }: GWDDetailsProps) {
  const supabase = createClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editedGWD, setEditedGWD] = useState<EditableGWD>(gwd)

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('gwds')
        .update({
          status: editedGWD.status,
          system: editedGWD.system,
          pipeline: editedGWD.pipeline,
          land_cost: editedGWD.land_cost,
          dig_cost: editedGWD.dig_cost,
          b_sleeve: editedGWD.b_sleeve,
          petro_sleeve: editedGWD.petro_sleeve,
          composite: editedGWD.composite,
          recoat: editedGWD.recoat,
          notes: editedGWD.notes
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">GWD #{gwd.gwd_number}</h2>
          <p className="text-gray-500">AFE: {gwd.afe?.afe_number}</p>
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
              <Label>Status</Label>
              {isEditing ? (
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={editedGWD.status}
                  onChange={e => setEditedGWD((prev: EditableGWD) => ({
                    ...prev,
                    status: e.target.value as GWDStatus
                  }))}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Complete">Complete</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Waiting for CLEIR">Waiting for CLEIR</option>
                  <option value="Ready">Ready</option>
                  <option value="No Longer Mine">No Longer Mine</option>
                </select>
              ) : (
                <p className="text-lg">{editedGWD.status}</p>
              )}
            </div>
            <div>
              <Label>System</Label>
              {isEditing ? (
                <Input
                  value={editedGWD.system || ''}
                  onChange={e => setEditedGWD((prev: EditableGWD) => ({
                    ...prev,
                    system: e.target.value
                  }))}
                />
              ) : (
                <p className="text-lg">{editedGWD.system || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label>Pipeline</Label>
              {isEditing ? (
                <Input
                  value={editedGWD.pipeline || ''}
                  onChange={e => setEditedGWD((prev: EditableGWD) => ({
                    ...prev,
                    pipeline: e.target.value
                  }))}
                />
              ) : (
                <p className="text-lg">{editedGWD.pipeline || 'N/A'}</p>
              )}
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
                  <p className="text-lg">${editedGWD.initial_budget.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Total Cost</Label>
                  <p className="text-lg">${(editedGWD.land_cost + editedGWD.dig_cost).toLocaleString()}</p>
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
    </div>
  )
} 