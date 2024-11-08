import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { AFE, GWDWithAFE, AFEWithPipelines, Pipeline } from '@/types/database'

interface GWDCreateProps {
  afes: AFEWithPipelines[]
  onSuccess: () => void
}

type GWDStatus = 'Complete' | 'In Progress' | 'Cancelled' | 'On Hold' | 'Not Started' | 'Waiting for CLEIR' | 'Ready' | 'No Longer Mine'

interface NewGWD {
  gwd_number: string
  afe_id: string
  system: string
  pipeline: string
  status: GWDStatus
  initial_budget: string
  land_cost: string
  dig_cost: string
  b_sleeve: string
  petro_sleeve: string
  composite: string
  recoat: string
  notes: string
}

export default function GWDCreate({ afes, onSuccess }: GWDCreateProps) {
  const supabase = createClient()
  const [newGWD, setNewGWD] = useState<NewGWD>({
    gwd_number: '',
    afe_id: '',
    system: '',
    pipeline: '',
    status: 'Not Started',
    initial_budget: '',
    land_cost: '0',
    dig_cost: '0',
    b_sleeve: '0',
    petro_sleeve: '0',
    composite: '0',
    recoat: '0',
    notes: ''
  })

  const [availablePipelines, setAvailablePipelines] = useState<Pipeline[]>([])

  const handleAFEChange = (afeId: string) => {
    const selectedAFE = afes.find(afe => afe.afe_id.toString() === afeId)
    
    setNewGWD(prev => ({
      ...prev,
      afe_id: afeId,
      system: selectedAFE?.system_id.toString() || '',
      pipeline: '',
    }))

    if (selectedAFE?.pipelines) {
      setAvailablePipelines(selectedAFE.pipelines.map(p => p.pipeline))
    } else {
      setAvailablePipelines([])
    }
  }

  const handleSave = async () => {
    try {
      // Validation
      if (!newGWD.gwd_number || !newGWD.afe_id) {
        alert('GWD Number and AFE are required')
        return
      }

      const gwd_number = parseInt(newGWD.gwd_number)
      const afe_id = parseInt(newGWD.afe_id)
      const initial_budget = parseFloat(newGWD.initial_budget)
      
      if (isNaN(gwd_number) || isNaN(afe_id) || isNaN(initial_budget)) {
        alert('Invalid number format')
        return
      }

      const { error } = await supabase
        .from('gwds')
        .insert({
          gwd_number,
          afe_id,
          system: newGWD.system,
          pipeline: newGWD.pipeline,
          status: newGWD.status,
          initial_budget,
          land_cost: parseFloat(newGWD.land_cost),
          dig_cost: parseFloat(newGWD.dig_cost),
          b_sleeve: parseInt(newGWD.b_sleeve) || 0,
          petro_sleeve: parseInt(newGWD.petro_sleeve) || 0,
          composite: parseInt(newGWD.composite) || 0,
          recoat: parseInt(newGWD.recoat) || 0,
          notes: newGWD.notes || null
        })

      if (error) throw error

      // Reset form and notify parent
      setNewGWD({
        gwd_number: '',
        afe_id: '',
        system: '',
        pipeline: '',
        status: 'Not Started',
        initial_budget: '',
        land_cost: '0',
        dig_cost: '0',
        b_sleeve: '0',
        petro_sleeve: '0',
        composite: '0',
        recoat: '0',
        notes: ''
      })
      onSuccess()
      alert('GWD created successfully!')
    } catch (error) {
      console.error('Error creating GWD:', error)
      alert(`Failed to create GWD: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="gwd_number">GWD Number</Label>
          <Input
            id="gwd_number"
            value={newGWD.gwd_number}
            onChange={e => setNewGWD((prev: NewGWD) => ({ ...prev, gwd_number: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="afe_id">AFE</Label>
          <select
            id="afe_id"
            className="w-full px-3 py-2 border rounded-md"
            value={newGWD.afe_id}
            onChange={e => handleAFEChange(e.target.value)}
          >
            <option value="">Select AFE</option>
            {afes.map(afe => (
              <option key={afe.afe_id} value={afe.afe_id}>
                {afe.afe_number}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="system">System</Label>
          <Input
            id="system"
            value={newGWD.system}
            readOnly
            className="bg-gray-50"
          />
        </div>
        <div>
          <Label htmlFor="pipeline">Pipeline</Label>
          <select
            id="pipeline"
            className="w-full px-3 py-2 border rounded-md"
            value={newGWD.pipeline || ''}
            onChange={e => setNewGWD(prev => ({ ...prev, pipeline: e.target.value }))}
            disabled={availablePipelines.length === 0}
          >
            <option value="">Select Pipeline</option>
            {availablePipelines.map(pipeline => (
              <option key={pipeline.pipeline_id} value={pipeline.pipeline_name}>
                {pipeline.pipeline_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          className="w-full px-3 py-2 border rounded-md"
          value={newGWD.status}
          onChange={e => setNewGWD((prev: NewGWD) => ({ ...prev, status: e.target.value as GWDStatus }))}
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
      </div>

      <div>
        <Label htmlFor="initial_budget">Initial Budget</Label>
        <Input
          id="initial_budget"
          type="number"
          value={newGWD.initial_budget}
          onChange={e => setNewGWD((prev: NewGWD) => ({ ...prev, initial_budget: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="land_cost">Land Cost</Label>
          <Input
            id="land_cost"
            type="number"
            value={newGWD.land_cost}
            onChange={e => setNewGWD((prev: NewGWD) => ({ ...prev, land_cost: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="dig_cost">Dig Cost</Label>
          <Input
            id="dig_cost"
            type="number"
            value={newGWD.dig_cost}
            onChange={e => setNewGWD((prev: NewGWD) => ({ ...prev, dig_cost: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="b_sleeve">B-Sleeve Count</Label>
          <Input
            id="b_sleeve"
            type="number"
            min="0"
            value={newGWD.b_sleeve}
            onChange={e => setNewGWD(prev => ({ ...prev, b_sleeve: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="petro_sleeve">Petro-Sleeve Count</Label>
          <Input
            id="petro_sleeve"
            type="number"
            min="0"
            value={newGWD.petro_sleeve}
            onChange={e => setNewGWD(prev => ({ ...prev, petro_sleeve: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="composite">Composite Count</Label>
          <Input
            id="composite"
            type="number"
            min="0"
            value={newGWD.composite}
            onChange={e => setNewGWD(prev => ({ ...prev, composite: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="recoat">Recoat Count</Label>
          <Input
            id="recoat"
            type="number"
            min="0"
            value={newGWD.recoat}
            onChange={e => setNewGWD(prev => ({ ...prev, recoat: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={newGWD.notes}
          onChange={e => setNewGWD((prev: NewGWD) => ({ ...prev, notes: e.target.value }))}
        />
      </div>

      <Button onClick={handleSave} className="mt-4">Save GWD</Button>
    </div>
  )
} 