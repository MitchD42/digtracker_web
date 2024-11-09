import { useState } from 'react'
import { Vendor } from '@/types/database'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { PlusCircle, Pencil, Save, X } from 'lucide-react'

interface VendorListProps {
  vendors: Vendor[]
  onVendorsChange: () => void
}

export default function VendorList({ vendors, onVendorsChange }: VendorListProps) {
  const supabase = createClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editedName, setEditedName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [newVendorName, setNewVendorName] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Filter vendors based on search
  const filteredVendors = vendors.filter(vendor =>
    vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAdd = async () => {
    if (!newVendorName.trim()) {
      setError('Vendor name cannot be empty')
      return
    }

    try {
      const { error: insertError } = await supabase
        .from('vendors')
        .insert([{ vendor_name: newVendorName.trim() }])

      if (insertError) throw insertError

      setNewVendorName('')
      setIsAdding(false)
      onVendorsChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add vendor')
    }
  }

  const handleEdit = async (vendorId: number) => {
    if (!editedName.trim()) {
      setError('Vendor name cannot be empty')
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('vendors')
        .update({ vendor_name: editedName.trim() })
        .eq('vendor_id', vendorId)

      if (updateError) throw updateError

      setEditingId(null)
      setEditedName('')
      onVendorsChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vendor')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search vendors..."
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
          Add Vendor
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
            placeholder="New vendor name"
            value={newVendorName}
            onChange={(e) => setNewVendorName(e.target.value)}
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
              setNewVendorName('')
              setError(null)
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {filteredVendors.map(vendor => (
          <div
            key={vendor.vendor_id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
          >
            {editingId === vendor.vendor_id ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="max-w-sm"
                />
                <Button onClick={() => handleEdit(vendor.vendor_id)}>
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
                <span>{vendor.vendor_name}</span>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingId(vendor.vendor_id)
                    setEditedName(vendor.vendor_name)
                    setError(null)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 