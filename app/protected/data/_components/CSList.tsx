import { useState } from 'react'
import { CSWithDetails } from '@/types/database'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { PlusCircle, Pencil, Save, X, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CSAssignmentModal } from './CSList/CSAssignmentModal'
import { UI } from '@/lib/constants/ui'

interface CSListProps {
  supervisors: CSWithDetails[]
  onSupervisorsChange: () => void
}

export default function CSList({ supervisors, onSupervisorsChange }: CSListProps) {
  const supabase = createClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editedName, setEditedName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [newCSName, setNewCSName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedCS, setSelectedCS] = useState<CSWithDetails | null>(null)

  // Filter CS based on search
  const filteredCS = supervisors.filter(cs => {
    const nameMatch = cs.name.toLowerCase().includes(searchTerm.toLowerCase());
    const poMatch = cs.purchase_orders?.some(po => {
      if (!po || !po.po) return false;
      return po.po.po_number?.toLowerCase().includes(searchTerm.toLowerCase());
    });
    return nameMatch || poMatch;
  });

  const handleAdd = async () => {
    if (!newCSName.trim()) {
      setError('Name cannot be empty')
      return
    }

    try {
      const { error: insertError } = await supabase
        .from('construction_supervisors')
        .insert([{ name: newCSName.trim() }])

      if (insertError) throw insertError

      setNewCSName('')
      setIsAdding(false)
      onSupervisorsChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add CS')
    }
  }

  const handleEdit = async (csId: number) => {
    if (!editedName.trim()) {
      setError('Name cannot be empty')
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('construction_supervisors')
        .update({ name: editedName.trim() })
        .eq('cs_id', csId)

      if (updateError) throw updateError

      setEditingId(null)
      setEditedName('')
      onSupervisorsChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update CS')
    }
  }

  return (
    <div className={UI.containers.section}>
      <div className="flex justify-between items-center mb-6">
        <Input
          placeholder="Search construction supervisors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button
          onClick={() => {
            setIsAdding(true)
            setError(null)
          }}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add CS
        </Button>
      </div>

      {error && (
        <div className={UI.containers.errorBox}>
          {error}
        </div>
      )}

      {isAdding && (
        <div className={UI.containers.card}>
          <Input
            placeholder="New CS name"
            value={newCSName}
            onChange={(e) => setNewCSName(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={handleAdd}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsAdding(false)
              setNewCSName('')
              setError(null)
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {filteredCS.map(cs => (
          <div
            key={cs.cs_id}
            className={`${UI.listItem.base} ${UI.listItem.interactive}`}
          >
            <div className={UI.listItem.header}>
              {editingId === cs.cs_id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="max-w-sm"
                  />
                  <Button onClick={() => handleEdit(cs.cs_id)}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingId(null)
                      setEditedName('')
                      setError(null)
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <span className={UI.text.title}>{cs.name}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCS(cs)}
                    >
                      Manage Assignments
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingId(cs.cs_id)
                        setEditedName(cs.name)
                        setError(null)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
            
            {/* Display POs */}
            {cs.purchase_orders && cs.purchase_orders.length > 0 && (
              <div className="mt-4">
                <h4 className={UI.text.label}>Purchase Orders:</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {cs.purchase_orders.map(poData => {
                    if (!poData.po) return null;
                    return (
                      <Badge
                        key={poData.cs_po_id}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {poData.po.po_number}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Display GWDs */}
            {cs.gwds && cs.gwds.length > 0 && (
              <div className="mt-4">
                <h4 className={UI.text.label}>GWDs:</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {cs.gwds.map(gwdData => (
                    <Badge
                      key={gwdData.cs_gwd_id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {`GWD ${gwdData.gwd.gwd_number}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedCS && (
        <CSAssignmentModal
          cs={selectedCS}
          isOpen={!!selectedCS}
          onClose={() => setSelectedCS(null)}
          onUpdate={onSupervisorsChange}
        />
      )}
    </div>
  )
} 