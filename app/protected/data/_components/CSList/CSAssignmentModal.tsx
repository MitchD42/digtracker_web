import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { createClient } from '@/utils/supabase/client'
import { CSWithDetails, POWithDetails, GWDWithAFE } from '@/types/database'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'

interface CSAssignmentModalProps {
  cs: CSWithDetails
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function CSAssignmentModal({ cs, isOpen, onClose, onUpdate }: CSAssignmentModalProps) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [localChanges, setLocalChanges] = useState(false)
  const [localPOs, setLocalPOs] = useState(cs.purchase_orders || [])
  const [localGWDs, setLocalGWDs] = useState(cs.gwds || [])
  const [availablePOs, setAvailablePOs] = useState<POWithDetails[]>([])
  const [availableGWDs, setAvailableGWDs] = useState<GWDWithAFE[]>([])
  const [selectedPO, setSelectedPO] = useState<string>('')
  const [selectedGWD, setSelectedGWD] = useState<string>('')

  useEffect(() => {
    setLocalPOs(cs.purchase_orders || [])
    setLocalGWDs(cs.gwds || [])
    loadAvailablePOs()
    loadAvailableGWDs()
  }, [cs])

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
      console.error('Error loading POs:', error)
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
      console.error('Error loading GWDs:', error)
      return
    }
    setAvailableGWDs(data)
  }

  const handleAddPO = async () => {
    if (!selectedPO) return

    try {
      const { error } = await supabase
        .from('cs_pos')
        .insert([{
          cs_id: cs.cs_id,
          po_id: parseInt(selectedPO),
          work_start: new Date().toISOString(),
          work_end: new Date().toISOString()
        }])

      if (error) throw error
      
      // Refresh local POs
      const { data } = await supabase
        .from('cs_pos')
        .select(`
          *,
          po:purchase_orders (
            *,
            vendor:vendors (*)
          )
        `)
        .eq('cs_id', cs.cs_id)

      setLocalPOs(data || [])
      setSelectedPO('')
      setLocalChanges(true)
    } catch (error) {
      console.error('Error adding PO:', error)
    }
  }

  const handleAddGWD = async () => {
    if (!selectedGWD) return

    try {
      const { error } = await supabase
        .from('cs_gwds')
        .insert([{
          cs_id: cs.cs_id,
          gwd_id: parseInt(selectedGWD),
          work_start: new Date().toISOString(),
          work_end: new Date().toISOString()
        }])

      if (error) throw error
      
      // Refresh local GWDs
      const { data } = await supabase
        .from('cs_gwds')
        .select(`
          *,
          gwd:gwds (
            *,
            afe:afes (*)
          )
        `)
        .eq('cs_id', cs.cs_id)

      setLocalGWDs(data || [])
      setSelectedGWD('')
      setLocalChanges(true)
    } catch (error) {
      console.error('Error adding GWD:', error)
    }
  }

  const handleRemovePO = async (csPOId: number) => {
    try {
      const { error } = await supabase
        .from('cs_pos')
        .delete()
        .eq('cs_po_id', csPOId)

      if (error) throw error
      
      setLocalPOs(prev => prev.filter(po => po.cs_po_id !== csPOId))
      setLocalChanges(true)
    } catch (error) {
      console.error('Error removing PO:', error)
    }
  }

  const handleRemoveGWD = async (csGWDId: number) => {
    try {
      const { error } = await supabase
        .from('cs_gwds')
        .delete()
        .eq('cs_gwd_id', csGWDId)

      if (error) throw error
      
      setLocalGWDs(prev => prev.filter(gwd => gwd.cs_gwd_id !== csGWDId))
      setLocalChanges(true)
    } catch (error) {
      console.error('Error removing GWD:', error)
    }
  }

  const updatePODate = async (csPOId: number, field: 'work_start' | 'work_end', date: Date) => {
    try {
      const { error } = await supabase
        .from('cs_pos')
        .update({ [field]: date.toISOString() })
        .eq('cs_po_id', csPOId)

      if (error) throw error
      
      setLocalPOs(prev => prev.map(po => 
        po.cs_po_id === csPOId 
          ? { ...po, [field]: date.toISOString() }
          : po
      ))
      setLocalChanges(true)
    } catch (error) {
      console.error('Error updating PO date:', error)
    }
  }

  const updateGWDDate = async (csGWDId: number, field: 'work_start' | 'work_end', date: Date) => {
    try {
      const { error } = await supabase
        .from('cs_gwds')
        .update({ [field]: date.toISOString() })
        .eq('cs_gwd_id', csGWDId)

      if (error) throw error
      
      setLocalGWDs(prev => prev.map(gwd => 
        gwd.cs_gwd_id === csGWDId 
          ? { ...gwd, [field]: date.toISOString() }
          : gwd
      ))
      setLocalChanges(true)
    } catch (error) {
      console.error('Error updating GWD date:', error)
    }
  }

  const handleClose = () => {
    if (localChanges) {
      onUpdate()
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{cs.name}'s Assignments</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* PO Assignments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Purchase Orders</h3>
              <div className="flex items-center gap-2">
                <Select value={selectedPO} onValueChange={setSelectedPO}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select PO..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePOs.map(po => (
                      <SelectItem key={po.po_id} value={po.po_id.toString()}>
                        PO {po.po_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddPO} disabled={!selectedPO}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              {localPOs.map((assignment) => (
                <div key={assignment.cs_po_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePO(assignment.cs_po_id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                    <div>
                      <p className="font-medium">PO {assignment.po?.po_number}</p>
                      <p className="text-sm text-muted-foreground">{assignment.po?.vendor?.vendor_name}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <label className="text-sm">Start Date</label>
                      <DatePicker
                        date={assignment.work_start ? new Date(assignment.work_start) : undefined}
                        setDate={(date?: Date) => {
                          if (date) updatePODate(assignment.cs_po_id, 'work_start', date)
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-sm">End Date</label>
                      <DatePicker
                        date={assignment.work_end ? new Date(assignment.work_end) : undefined}
                        setDate={(date?: Date) => {
                          if (date) updatePODate(assignment.cs_po_id, 'work_end', date)
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GWD Assignments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">GWDs</h3>
              <div className="flex items-center gap-2">
                <Select value={selectedGWD} onValueChange={setSelectedGWD}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select GWD..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGWDs.map(gwd => (
                      <SelectItem key={gwd.gwd_id} value={gwd.gwd_id.toString()}>
                        GWD {gwd.gwd_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddGWD} disabled={!selectedGWD}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {localGWDs.map((assignment) => (
                <div key={assignment.cs_gwd_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveGWD(assignment.cs_gwd_id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                    <div>
                      <p className="font-medium">GWD {assignment.gwd?.gwd_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.gwd?.afe?.afe_number ?? 'No AFE'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <label className="text-sm">Start Date</label>
                      <DatePicker
                        date={assignment.work_start ? new Date(assignment.work_start) : undefined}
                        setDate={(date?: Date) => {
                          if (date) updateGWDDate(assignment.cs_gwd_id, 'work_start', date)
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-sm">End Date</label>
                      <DatePicker
                        date={assignment.work_end ? new Date(assignment.work_end) : undefined}
                        setDate={(date?: Date) => {
                          if (date) updateGWDDate(assignment.cs_gwd_id, 'work_end', date)
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 