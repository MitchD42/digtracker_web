'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { AFE, Vendor } from '@/types/database'

interface POCreateProps {
  afes: AFE[]
  vendors: Vendor[]
  onSuccess: () => void
}

interface NewPO {
  po_number: string
  afe_id: string
  vendor_id: string
  initial_value: string
  status: 'Open' | 'Closed'
  notes: string
}

export default function POCreate({ afes, vendors, onSuccess }: POCreateProps) {
  const supabase = createClient()
  const [newPO, setNewPO] = useState<NewPO>({
    po_number: '',
    afe_id: '',
    vendor_id: '',
    initial_value: '',
    status: 'Open',
    notes: ''
  })

  const handleSave = async () => {
    try {
      // Validation
      if (!newPO.po_number || !newPO.afe_id || !newPO.vendor_id || !newPO.initial_value) {
        alert('PO Number, AFE, Vendor, and Initial Value are required')
        return
      }

      const { error } = await supabase
        .from('purchase_orders')
        .insert({
          po_number: newPO.po_number,
          afe_id: parseInt(newPO.afe_id),
          vendor_id: parseInt(newPO.vendor_id),
          initial_value: parseFloat(newPO.initial_value),
          status: newPO.status,
          notes: newPO.notes || null
        })

      if (error) throw error

      setNewPO({
        po_number: '',
        afe_id: '',
        vendor_id: '',
        initial_value: '',
        status: 'Open',
        notes: ''
      })
      onSuccess()
      alert('PO created successfully!')
    } catch (error) {
      console.error('Error creating PO:', error)
      alert(`Failed to create PO: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="po_number">PO Number</Label>
            <Input
              id="po_number"
              value={newPO.po_number}
              onChange={e => setNewPO(prev => ({ ...prev, po_number: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="afe_id">AFE</Label>
            <select
              id="afe_id"
              className="w-full px-3 py-2 border rounded-md"
              value={newPO.afe_id}
              onChange={e => setNewPO(prev => ({ ...prev, afe_id: e.target.value }))}
            >
              <option value="">Select AFE</option>
              {afes.map(afe => (
                <option key={afe.afe_id} value={afe.afe_id}>
                  {afe.afe_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="vendor_id">Vendor</Label>
            <select
              id="vendor_id"
              className="w-full px-3 py-2 border rounded-md"
              value={newPO.vendor_id}
              onChange={e => setNewPO(prev => ({ ...prev, vendor_id: e.target.value }))}
            >
              <option value="">Select Vendor</option>
              {vendors.map(vendor => (
                <option key={vendor.vendor_id} value={vendor.vendor_id}>
                  {vendor.vendor_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Financial Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="initial_value">Initial Value</Label>
            <Input
              id="initial_value"
              type="number"
              value={newPO.initial_value}
              onChange={e => setNewPO(prev => ({ ...prev, initial_value: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="w-full px-3 py-2 border rounded-md"
              value={newPO.status}
              onChange={e => setNewPO(prev => ({ ...prev, status: e.target.value as 'Open' | 'Closed' }))}
            >
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={newPO.notes}
              onChange={e => setNewPO(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} className="w-full">Create PO</Button>
    </div>
  )
} 