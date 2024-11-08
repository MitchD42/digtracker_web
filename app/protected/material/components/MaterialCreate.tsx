import { useState, ChangeEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { Vendor } from '@/types/database'

interface MaterialCreateProps {
  onSuccess: () => void
  vendors: Vendor[]  // Vendors are now passed as props
}

interface NewMaterial {
  vendor_id: number
  price: string
  length: string
  vendor_ref_id: string
  notes: string
}

export default function MaterialCreate({ onSuccess, vendors }: MaterialCreateProps) {
  const supabase = createClient()
  const [newMaterial, setNewMaterial] = useState<NewMaterial>({
    vendor_id: 0,
    price: '',
    length: '',
    vendor_ref_id: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateForm = (): boolean => {
    if (!newMaterial.vendor_id) {
      setError('Vendor is required')
      return false
    }

    const price = parseFloat(newMaterial.price)
    if (isNaN(price) || price <= 0) {
      setError('Price must be a positive number')
      return false
    }

    setError(null)
    return true
  }

  const handleSave = async () => {
    try {
      if (!validateForm()) return
      setIsSubmitting(true)

      const { error: materialError } = await supabase
        .from('materials')
        .insert({
          vendor_id: newMaterial.vendor_id,
          price: parseFloat(newMaterial.price),
          length: newMaterial.length ? parseFloat(newMaterial.length) : null,
          vendor_ref_id: newMaterial.vendor_ref_id || null,
          notes: newMaterial.notes || null,
          created_date: new Date().toISOString()
        })

      if (materialError) throw materialError

      onSuccess()
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create material')
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
          <Label>Vendor *</Label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={newMaterial.vendor_id}
            onChange={(e) => setNewMaterial(prev => ({ ...prev, vendor_id: Number(e.target.value) }))}
          >
            <option value="">Select vendor</option>
            {vendors.map(vendor => (
              <option key={vendor.vendor_id} value={vendor.vendor_id}>
                {vendor.vendor_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Price *</Label>
          <Input
            type="number"
            value={newMaterial.price}
            onChange={(e) => setNewMaterial(prev => ({ ...prev, price: e.target.value }))}
            placeholder="Enter price"
          />
        </div>

        <div>
          <Label>Length (ft)</Label>
          <Input
            type="number"
            value={newMaterial.length}
            onChange={(e) => setNewMaterial(prev => ({ ...prev, length: e.target.value }))}
            placeholder="Enter length"
          />
        </div>

        <div>
          <Label>Vendor Reference ID</Label>
          <Input
            value={newMaterial.vendor_ref_id}
            onChange={(e) => setNewMaterial(prev => ({ ...prev, vendor_ref_id: e.target.value }))}
            placeholder="Enter vendor reference ID"
          />
        </div>

        <div>
          <Label>Notes</Label>
          <Input
            value={newMaterial.notes}
            onChange={(e) => setNewMaterial(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Enter any additional notes"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => {
            setNewMaterial({
              vendor_id: 0,
              price: '',
              length: '',
              vendor_ref_id: '',
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
          {isSubmitting ? 'Creating...' : 'Create Material'}
        </Button>
      </div>
    </div>
  )
} 