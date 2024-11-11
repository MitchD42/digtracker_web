'use client'

import { useState } from 'react'
import { POWithDetails } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'
import { X, Edit2, Save, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface PODetailsProps {
  po: POWithDetails
  onClose: () => void
  onUpdate: () => void
}

interface EditablePO extends POWithDetails {
  status: 'Open' | 'Closed'
}

interface ChangeOrder {
  co_number: string
  value: number
  description: string
}

export default function PODetails({ po, onClose, onUpdate }: PODetailsProps) {
  const supabase = createClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editedPO, setEditedPO] = useState<EditablePO>(po)
  const [showAddChangeOrder, setShowAddChangeOrder] = useState(false)
  const [newChangeOrder, setNewChangeOrder] = useState<ChangeOrder>({
    co_number: '',
    value: 0,
    description: ''
  })

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({
          status: editedPO.status,
          notes: editedPO.notes
        })
        .eq('po_id', po.po_id)

      if (error) throw error

      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating PO:', error)
      alert('Failed to update PO')
    }
  }

  const handleAddChangeOrder = async () => {
    try {
      const { error } = await supabase
        .from('change_orders')
        .insert({
          po_id: po.po_id,
          co_number: newChangeOrder.co_number,
          value: newChangeOrder.value,
          description: newChangeOrder.description
        })

      if (error) throw error

      setShowAddChangeOrder(false)
      setNewChangeOrder({ co_number: '', value: 0, description: '' })
      onUpdate()
    } catch (error) {
      console.error('Error adding change order:', error)
      alert('Failed to add change order')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">PO #{po.po_number}</h2>
          <p className="text-muted-foreground">
            AFE: {po.afe.afe_number} | Vendor: {po.vendor.vendor_name}
          </p>
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
                  value={editedPO.status}
                  onChange={e => setEditedPO(prev => ({
                    ...prev,
                    status: e.target.value as 'Open' | 'Closed'
                  }))}
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              ) : (
                <p className="text-lg">{editedPO.status}</p>
              )}
            </div>
            <div>
              <Label>Notes</Label>
              {isEditing ? (
                <Input
                  value={editedPO.notes || ''}
                  onChange={e => setEditedPO(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                />
              ) : (
                <p className="text-lg">{editedPO.notes || 'No notes'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Change Orders</CardTitle>
              <Button size="sm" onClick={() => setShowAddChangeOrder(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {editedPO.change_orders.map((co, index) => (
                <div key={index} className="border-b pb-2">
                  <div className="flex justify-between">
                    <span className="font-medium">#{co.co_number}</span>
                    <span>${co.value.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{co.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddChangeOrder} onOpenChange={setShowAddChangeOrder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Change Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Change Order Number</Label>
              <Input
                value={newChangeOrder.co_number}
                onChange={e => setNewChangeOrder(prev => ({
                  ...prev,
                  co_number: e.target.value
                }))}
              />
            </div>
            <div>
              <Label>Value</Label>
              <Input
                type="number"
                value={newChangeOrder.value}
                onChange={e => setNewChangeOrder(prev => ({
                  ...prev,
                  value: parseFloat(e.target.value) || 0
                }))}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={newChangeOrder.description}
                onChange={e => setNewChangeOrder(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
              />
            </div>
            <Button onClick={handleAddChangeOrder}>Add Change Order</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 