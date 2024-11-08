import { useState } from 'react'
import { CSWithDetails, POWithDetails, GWDWithAFE } from '@/types/database'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { PlusCircle, Pencil, Save, X, Plus, CalendarIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
  const [selectedPO, setSelectedPO] = useState<string>('')
  const [selectedGWDs, setSelectedGWDs] = useState<number[]>([])
  const [workStart, setWorkStart] = useState<Date>()
  const [workEnd, setWorkEnd] = useState<Date>()
  const [isAddingPO, setIsAddingPO] = useState(false)
  const [isAddingGWD, setIsAddingGWD] = useState(false)
  const [availablePOs, setAvailablePOs] = useState<POWithDetails[]>([])
  const [availableGWDs, setAvailableGWDs] = useState<GWDWithAFE[]>([])

  // Filter CS based on search
  const filteredCS = supervisors.filter(cs =>
    cs.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cs.purchase_orders?.some(po => 
      po.po_number.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const loadAvailablePOs = async () => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        vendor:vendors (*),
        afe:afes (*)
      `)
      .order('created_date', { ascending: false })

    if (error) {
      setError('Failed to load POs')
      return
    }
    setAvailablePOs(data)
  }

  const loadAvailableGWDs = async () => {
    const { data, error } = await supabase
      .from('gwds')
      .select(`
        *,
        afe:afes (*)
      `)
      .order('gwd_number', { ascending: false })

    if (error) {
      setError('Failed to load GWDs')
      return
    }
    setAvailableGWDs(data)
  }

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

  const handleAddPO = async (csId: number, poId: number) => {
    if (!workStart || !workEnd) {
      setError('Please select both start and end dates')
      return
    }

    try {
      const { error: insertError } = await supabase
        .from('cs_pos')
        .insert([{ 
          cs_id: csId, 
          po_id: poId,
          work_start: workStart.toISOString(),
          work_end: workEnd.toISOString()
        }])

      if (insertError) throw insertError

      setWorkStart(undefined)
      setWorkEnd(undefined)
      setSelectedPO('')
      setIsAddingPO(false)
      onSupervisorsChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add PO')
    }
  }

  const handleAddGWDs = async (csId: number) => {
    if (!workStart || !workEnd) {
      setError('Please select both start and end dates')
      return
    }

    try {
      const gwdInserts = selectedGWDs.map(gwdId => ({
        cs_id: csId,
        gwd_id: gwdId,
        work_start: workStart.toISOString(),
        work_end: workEnd.toISOString()
      }))

      const { error: insertError } = await supabase
        .from('cs_gwds')
        .insert(gwdInserts)

      if (insertError) throw insertError

      setWorkStart(undefined)
      setWorkEnd(undefined)
      setSelectedGWDs([])
      setIsAddingGWD(false)
      onSupervisorsChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add GWDs')
    }
  }

  const handleRemovePO = async (csId: number, poId: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('cs_pos')
        .delete()
        .eq('cs_id', csId)
        .eq('po_id', poId)

      if (deleteError) throw deleteError

      onSupervisorsChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove PO')
    }
  }

  const handleRemoveGWD = async (csId: number, gwdId: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('cs_gwds')
        .delete()
        .eq('cs_id', csId)
        .eq('gwd_id', gwdId)

      if (deleteError) throw deleteError

      onSupervisorsChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove GWD')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
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
        <div className="p-4 text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {isAdding && (
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-gray-50">
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

      <div className="space-y-2">
        {filteredCS.map(cs => (
          <div
            key={cs.cs_id}
            className="p-4 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center justify-between mb-2">
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
                  <span className="font-medium">{cs.name}</span>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedCS(cs)
                            loadAvailablePOs()
                            setIsAddingPO(true)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add PO
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add PO to {cs.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <Select
                            value={selectedPO}
                            onValueChange={setSelectedPO}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select PO" />
                            </SelectTrigger>
                            <SelectContent>
                              {availablePOs.map(po => (
                                <SelectItem key={po.po_id} value={po.po_id.toString()}>
                                  {po.po_number}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <label className="text-sm font-medium mb-2 block">
                                Work Start
                              </label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {workStart ? format(workStart, 'PPP') : 'Pick a date'}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={workStart}
                                    onSelect={setWorkStart}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div className="flex-1">
                              <label className="text-sm font-medium mb-2 block">
                                Work End
                              </label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {workEnd ? format(workEnd, 'PPP') : 'Pick a date'}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={workEnd}
                                    onSelect={setWorkEnd}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                          <Button 
                            className="w-full"
                            onClick={() => handleAddPO(cs.cs_id, parseInt(selectedPO))}
                            disabled={!selectedPO || !workStart || !workEnd}
                          >
                            Add PO
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedCS(cs)
                            loadAvailableGWDs()
                            setIsAddingGWD(true)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add GWDs
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add GWDs to {cs.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                            {availableGWDs.map(gwd => (
                              <div key={gwd.gwd_id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={selectedGWDs.includes(gwd.gwd_id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedGWDs([...selectedGWDs, gwd.gwd_id])
                                    } else {
                                      setSelectedGWDs(selectedGWDs.filter(id => id !== gwd.gwd_id))
                                    }
                                  }}
                                />
                                <span>GWD #{gwd.gwd_number}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <label className="text-sm font-medium mb-2 block">
                                Work Start
                              </label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {workStart ? format(workStart, 'PPP') : 'Pick a date'}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={workStart}
                                    onSelect={setWorkStart}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div className="flex-1">
                              <label className="text-sm font-medium mb-2 block">
                                Work End
                              </label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {workEnd ? format(workEnd, 'PPP') : 'Pick a date'}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={workEnd}
                                    onSelect={setWorkEnd}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                          <Button 
                            className="w-full"
                            onClick={() => handleAddGWDs(cs.cs_id)}
                            disabled={selectedGWDs.length === 0 || !workStart || !workEnd}
                          >
                            Add Selected GWDs
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
              <div>
                <h4 className="text-sm font-medium mb-2">Purchase Orders:</h4>
                <div className="flex flex-wrap gap-2">
                  {cs.purchase_orders.map(po => (
                    <Badge
                      key={po.po_id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {po.po_number}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleRemovePO(cs.cs_id, po.po_id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {/* Display GWDs */}
            {cs.gwds && cs.gwds.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2">GWDs:</h4>
                <div className="flex flex-wrap gap-2">
                  {cs.gwds.map(gwd => (
                    <Badge
                      key={gwd.gwd_id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      GWD #{gwd.gwd_number}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleRemoveGWD(cs.cs_id, gwd.gwd_id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 