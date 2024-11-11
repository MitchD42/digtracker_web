import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { AFE, GWDWithAFE, AFEWithPipelines, Pipeline, System } from '@/types/database'
import { UI } from '@/lib/constants/ui'

interface GWDCreateProps {
  afes: AFEWithPipelines[]
  systems: System[]
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
  execution_year?: string
  dig_name?: string
  inspection_provider?: string
}

export default function GWDCreate({ afes, systems, onSuccess }: GWDCreateProps) {
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
    notes: '',
    execution_year: '',
    dig_name: '',
    inspection_provider: ''
  })

  const [availablePipelines, setAvailablePipelines] = useState<Pipeline[]>([])

  const handleAFEChange = (afeId: string) => {
    console.log('AFE ID:', afeId)
    console.log('All AFEs:', afes)
    
    if (!afeId) {
      setNewGWD(prev => ({
        ...prev,
        afe_id: '',
        system: '',
        pipeline: '',
      }))
      setAvailablePipelines([])
      return
    }

    const selectedAFE = afes.find(afe => afe.afe_id.toString() === afeId)
    console.log('Selected AFE:', selectedAFE)
    
    if (!selectedAFE) {
      console.log('No AFE found')
      return
    }

    console.log('Systems:', systems)
    console.log('Selected AFE system_id:', selectedAFE.system_id)
    console.log('AFE Pipelines:', selectedAFE.afe_pipelines)
    
    const systemName = systems.find(s => s.system_id === selectedAFE.system_id)?.system_name || ''
    console.log('System Name:', systemName)
    
    setNewGWD(prev => ({
      ...prev,
      afe_id: afeId,
      system: systemName,
      pipeline: '',
    }))

    if (selectedAFE.afe_pipelines && selectedAFE.afe_pipelines.length > 0) {
      console.log('Setting pipelines:', selectedAFE.afe_pipelines.map(ap => ap.pipeline))
      setAvailablePipelines(selectedAFE.afe_pipelines.map(ap => ap.pipeline))
    } else {
      console.log('No pipelines found')
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
          notes: newGWD.notes || null,
          execution_year: newGWD.execution_year,
          dig_name: newGWD.dig_name,
          inspection_provider: newGWD.inspection_provider
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
        notes: '',
        execution_year: '',
        dig_name: '',
        inspection_provider: ''
      })
      onSuccess()
      alert('GWD created successfully!')
    } catch (error) {
      console.error('Error creating GWD:', error)
      alert(`Failed to create GWD: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className={UI.containers.section}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className={UI.text.label} htmlFor="gwd_number">GWD Number</Label>
          <Input
            id="gwd_number"
            value={newGWD.gwd_number}
            onChange={e => setNewGWD((prev: NewGWD) => ({ ...prev, gwd_number: e.target.value }))}
          />
        </div>
        <div>
          <Label className={UI.text.label} htmlFor="afe_id">AFE</Label>
          <select
            id="afe_id"
            className={UI.inputs.select}
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
          <Label className={UI.text.label} htmlFor="system">System</Label>
          <Input
            id="system"
            value={newGWD.system}
            readOnly
            className="bg-muted"
          />
        </div>
        <div>
          <Label className={UI.text.label} htmlFor="pipeline">Pipeline</Label>
          <select
            id="pipeline"
            className={UI.inputs.select}
            value={newGWD.pipeline || ''}
            onChange={e => setNewGWD(prev => ({ ...prev, pipeline: e.target.value }))}
            disabled={availablePipelines.length === 0}
          >
            <option value="">Select Pipeline</option>
            {availablePipelines && availablePipelines.map(pipeline => (
              <option key={pipeline.pipeline_id} value={pipeline.pipeline_name}>
                {pipeline.pipeline_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label className={UI.text.label} htmlFor="status">Status</Label>
        <select
          id="status"
          className={UI.inputs.select}
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
        <Label className={UI.text.label} htmlFor="initial_budget">Initial Budget</Label>
        <Input
          id="initial_budget"
          type="number"
          value={newGWD.initial_budget}
          onChange={e => setNewGWD((prev: NewGWD) => ({ ...prev, initial_budget: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className={UI.text.label} htmlFor="land_cost">Land Cost</Label>
          <Input
            id="land_cost"
            type="number"
            value={newGWD.land_cost}
            onChange={e => setNewGWD((prev: NewGWD) => ({ ...prev, land_cost: e.target.value }))}
          />
        </div>
        <div>
          <Label className={UI.text.label} htmlFor="dig_cost">Dig Cost</Label>
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
          <Label className={UI.text.label} htmlFor="b_sleeve">B-Sleeve Count</Label>
          <Input
            id="b_sleeve"
            type="number"
            min="0"
            value={newGWD.b_sleeve}
            onChange={e => setNewGWD(prev => ({ ...prev, b_sleeve: e.target.value }))}
          />
        </div>
        <div>
          <Label className={UI.text.label} htmlFor="petro_sleeve">Petro-Sleeve Count</Label>
          <Input
            id="petro_sleeve"
            type="number"
            min="0"
            value={newGWD.petro_sleeve}
            onChange={e => setNewGWD(prev => ({ ...prev, petro_sleeve: e.target.value }))}
          />
        </div>
        <div>
          <Label className={UI.text.label} htmlFor="composite">Composite Count</Label>
          <Input
            id="composite"
            type="number"
            min="0"
            value={newGWD.composite}
            onChange={e => setNewGWD(prev => ({ ...prev, composite: e.target.value }))}
          />
        </div>
        <div>
          <Label className={UI.text.label} htmlFor="recoat">Recoat Count</Label>
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
        <Label className={UI.text.label} htmlFor="notes">Notes</Label>
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