import { useState } from 'react'
import { System, Pipeline } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusCircle, Edit2, Save, X, ChevronDown, ChevronRight } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import PipelinesList from './PipelinesList'

interface SystemsListProps {
  systems: System[]
  onSystemsChange: () => void
}

export default function SystemsList({ 
  systems, 
  onSystemsChange 
}: SystemsListProps) {
  const supabase = createClient()
  const [newSystemName, setNewSystemName] = useState('')
  const [editingSystem, setEditingSystem] = useState<System | null>(null)
  const [expandedSystem, setExpandedSystem] = useState<System | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAddSystem = async () => {
    if (!newSystemName.trim()) return
    try {
      const { error } = await supabase
        .from('systems')
        .insert({ 
          system_name: newSystemName.trim(),
          created_date: new Date().toISOString()
        })

      if (error) throw error
      setNewSystemName('')
      onSystemsChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add system')
    }
  }

  const handleUpdateSystem = async () => {
    if (!editingSystem) return
    try {
      const { error } = await supabase
        .from('systems')
        .update({ system_name: editingSystem.system_name })
        .eq('system_id', editingSystem.system_id)

      if (error) throw error
      setEditingSystem(null)
      onSystemsChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update system')
    }
  }

  const toggleSystem = (system: System) => {
    if (expandedSystem?.system_id === system.system_id) {
      setExpandedSystem(null)
    } else {
      setExpandedSystem(system)
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Systems</h3>
      
      {error && (
        <div className="p-4 mb-4 text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="New system name"
          value={newSystemName}
          onChange={(e) => setNewSystemName(e.target.value)}
        />
        <Button onClick={handleAddSystem}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {systems.map(system => (
          <div key={system.system_id} className="border rounded-lg">
            <div
              className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => toggleSystem(system)}
            >
              <div className="flex items-center gap-2">
                {expandedSystem?.system_id === system.system_id ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
                {editingSystem?.system_id === system.system_id ? (
                  <Input
                    value={editingSystem.system_name}
                    onChange={(e) => setEditingSystem({
                      ...editingSystem,
                      system_name: e.target.value
                    })}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span>{system.system_name}</span>
                )}
              </div>
              <div className="flex gap-2">
                {editingSystem?.system_id === system.system_id ? (
                  <>
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUpdateSystem()
                      }}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingSystem(null)
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingSystem(system)
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
            {expandedSystem?.system_id === system.system_id && (
              <div className="border-t p-3 bg-gray-50">
                <PipelinesList
                  system={system}
                  onSystemsChange={onSystemsChange}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 