import { useState, useEffect } from 'react'
import { System, Pipeline } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusCircle, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface PipelinesListProps {
  system: System
  onSystemsChange: () => void
}

export default function PipelinesList({ 
  system,
  onSystemsChange 
}: PipelinesListProps) {
  const supabase = createClient()
  const [newPipelineName, setNewPipelineName] = useState('')
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadPipelines = async () => {
    try {
      const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .eq('system_id', system.system_id)
        .order('pipeline_name')

      if (error) throw error
      setPipelines(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pipelines')
    }
  }

  useEffect(() => {
    loadPipelines()
  }, [system.system_id])

  const handleAddPipeline = async () => {
    if (!newPipelineName.trim()) return
    try {
      const { error } = await supabase
        .from('pipelines')
        .insert({
          pipeline_name: newPipelineName.trim(),
          system_id: system.system_id,
          created_date: new Date().toISOString()
        })

      if (error) throw error
      setNewPipelineName('')
      loadPipelines()
      onSystemsChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add pipeline')
    }
  }

  const handleDeletePipeline = async (pipelineId: number) => {
    try {
      const { error } = await supabase
        .from('pipelines')
        .delete()
        .eq('pipeline_id', pipelineId)

      if (error) throw error
      loadPipelines()
      onSystemsChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pipeline')
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 mb-4 text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="New pipeline name"
          value={newPipelineName}
          onChange={(e) => setNewPipelineName(e.target.value)}
        />
        <Button onClick={handleAddPipeline}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {pipelines.map(pipeline => (
          <div
            key={pipeline.pipeline_id}
            className="flex justify-between items-center p-3 border rounded-lg bg-white"
          >
            <span>{pipeline.pipeline_name}</span>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700"
              onClick={() => handleDeletePipeline(pipeline.pipeline_id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
} 