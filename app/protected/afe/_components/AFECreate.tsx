import { useState, ChangeEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { AFE, AFEPipeline, AFEStatus, Pipeline, System } from '@/types/database'
import { X, PlusCircle } from 'lucide-react'

interface AFECreateProps {
  onSuccess: () => void
  systems: System[]
}

interface NewAFE {
  afe_number: string
  description: string
  budget: string
  system_id: number | null
  pipelines: Pick<Pipeline, 'pipeline_id' | 'pipeline_name'>[]
  notes: string
}

export default function AFECreate({ onSuccess, systems }: AFECreateProps) {
  const supabase = createClient()
  const [newAFE, setNewAFE] = useState<NewAFE>({
    afe_number: '',
    description: '',
    budget: '',
    system_id: null,
    pipelines: [],
    notes: ''
  })
  const [availablePipelines, setAvailablePipelines] = useState<Pipeline[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (systems.length === 0) {
    return (
      <div className="p-6 text-center border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-medium mb-2">System Required</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          You need to create at least one system before you can create an AFE.
        </p>
        <Button 
          onClick={() => window.location.href = '/protected/systems'}
          className="inline-flex items-center"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Set Up Systems
        </Button>
      </div>
    )
  }

  const loadPipelines = async (systemId: number) => {
    const { data, error } = await supabase
      .from('pipelines')
      .select(`
        pipeline_id,
        pipeline_name,
        system_id,
        created_date
      `)
      .eq('system_id', systemId)

    if (error) {
      console.error('Error loading pipelines:', error)
      return
    }
    
    const pipelines = data.map(p => ({
      pipeline_id: p.pipeline_id as number,
      pipeline_name: p.pipeline_name as string,
      system_id: p.system_id as number,
      created_date: p.created_date as string
    })) satisfies Pipeline[]
    
    setAvailablePipelines(pipelines)
  }

  const handleSystemChange = async (systemId: number) => {
    setNewAFE(prev => ({ ...prev, system_id: systemId, pipelines: [] }))
    await loadPipelines(systemId)
  }

  const validateForm = (): boolean => {
    if (!newAFE.afe_number.trim()) {
      setError('AFE Number is required')
      return false
    }

    const budget = parseFloat(newAFE.budget)
    if (isNaN(budget) || budget <= 0) {
      setError('Budget must be a positive number')
      return false
    }

    if (!newAFE.system_id) {
      setError('System is required')
      return false
    }

    setError(null)
    return true
  }

  const handleSave = async () => {
    try {
      if (!validateForm()) return
      setIsSubmitting(true)

      const { data: afeData, error: afeError } = await supabase
        .from('afes')
        .insert({
          afe_number: newAFE.afe_number,
          description: newAFE.description || null,
          budget: parseFloat(newAFE.budget),
          status: 'Draft' satisfies AFEStatus,
          system_id: newAFE.system_id!,
          notes: newAFE.notes || null,
          current_costs: 0
        })
        .select()
        .single()

      if (afeError) throw afeError

      if (newAFE.pipelines.length > 0) {
        type AFEPipelineInsert = Pick<AFEPipeline, 'afe_id' | 'pipeline_id' | 'created_date'>
        
        const afePipelines: AFEPipelineInsert[] = newAFE.pipelines.map(pipeline => ({
          afe_id: afeData.afe_id,
          pipeline_id: pipeline.pipeline_id,
          created_date: new Date().toISOString()
        }))

        const { error: pipelineError } = await supabase
          .from('afe_pipelines')
          .insert(afePipelines)

        if (pipelineError) throw pipelineError
      }

      onSuccess()
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create AFE')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        <div>
          <Label htmlFor="afe_number">AFE Number *</Label>
          <Input
            id="afe_number"
            value={newAFE.afe_number}
            onChange={(e: ChangeEvent<HTMLInputElement>) => 
              setNewAFE(prev => ({ ...prev, afe_number: e.target.value }))}
            placeholder="Enter AFE number"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={newAFE.description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => 
              setNewAFE(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter description"
          />
        </div>

        <div>
          <Label htmlFor="budget">Budget *</Label>
          <Input
            id="budget"
            type="number"
            value={newAFE.budget}
            onChange={(e: ChangeEvent<HTMLInputElement>) => 
              setNewAFE(prev => ({ ...prev, budget: e.target.value }))}
            placeholder="Enter budget amount"
          />
        </div>

        <div>
          <Label htmlFor="system">System *</Label>
          <select
            id="system"
            className="w-full border rounded-md px-3 py-2"
            value={newAFE.system_id || ''}
            onChange={(e) => handleSystemChange(Number(e.target.value))}
          >
            <option value="">Select a system</option>
            {systems.map(system => (
              <option key={system.system_id} value={system.system_id}>
                {system.system_name}
              </option>
            ))}
          </select>
        </div>

        {newAFE.system_id && (
          <div>
            <Label>Pipelines</Label>
            <div className="space-y-2">
              {availablePipelines.map(pipeline => (
                <label key={pipeline.pipeline_id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newAFE.pipelines.some(p => p.pipeline_id === pipeline.pipeline_id)}
                    onChange={(e) => {
                      setNewAFE(prev => ({
                        ...prev,
                        pipelines: e.target.checked
                          ? [...prev.pipelines, {
                              pipeline_id: pipeline.pipeline_id,
                              pipeline_name: pipeline.pipeline_name
                            }]
                          : prev.pipelines.filter(p => p.pipeline_id !== pipeline.pipeline_id)
                      }))
                    }}
                  />
                  <span>{pipeline.pipeline_name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            value={newAFE.notes}
            onChange={(e: ChangeEvent<HTMLInputElement>) => 
              setNewAFE(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Enter any additional notes"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => {
            setNewAFE({
              afe_number: '',
              description: '',
              budget: '',
              system_id: null,
              pipelines: [],
              notes: ''
            })
            setError(null)
          }}
        >
          Clear
        </Button>
        <Button 
          onClick={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create AFE'}
        </Button>
      </div>
    </div>
  )
} 