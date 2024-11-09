import { useState } from 'react'
import { Material, Vendor } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'
import { X, Edit2, Save, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface MaterialDetailsProps {
  material: Material
  onClose: () => void
  onUpdate: () => void
}

export default function MaterialDetails({ 
  material, 
  onClose, 
  onUpdate 
}: MaterialDetailsProps) {
  const supabase = createClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editedMaterial, setEditedMaterial] = useState<Material>(material)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    try {
      const { error: updateError } = await supabase
        .from('materials')
        .update({
          price: editedMaterial.price,
          length: editedMaterial.length,
          vendor_ref_id: editedMaterial.vendor_ref_id,
          notes: editedMaterial.notes
        })
        .eq('material_id', material.material_id)

      if (updateError) throw updateError

      setIsEditing(false)
      onUpdate()
    } catch (err) {
      console.error('Error saving material:', err)
      setError('Failed to save material')
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{material.vendor.vendor_name}</h2>
          <p className="text-gray-500">Created: {new Date(material.created_date).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} variant="default">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)} variant="default">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button onClick={onClose} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Material Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Vendor Reference ID</Label>
              {isEditing ? (
                <Input
                  value={editedMaterial.vendor_ref_id || ''}
                  onChange={e => setEditedMaterial(prev => ({ 
                    ...prev, 
                    vendor_ref_id: e.target.value 
                  }))}
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300">
                  {editedMaterial.vendor_ref_id || 'N/A'}
                </p>
              )}
            </div>

            <div>
              <Label>Price</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedMaterial.price}
                  onChange={e => setEditedMaterial(prev => ({ 
                    ...prev, 
                    price: parseFloat(e.target.value) 
                  }))}
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300">
                  ${editedMaterial.price.toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <Label>Length (ft)</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedMaterial.length || ''}
                  onChange={e => setEditedMaterial(prev => ({ 
                    ...prev, 
                    length: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300">
                  {editedMaterial.length ? `${editedMaterial.length} ft` : 'N/A'}
                </p>
              )}
            </div>

            <div>
              <Label>Notes</Label>
              {isEditing ? (
                <Input
                  value={editedMaterial.notes || ''}
                  onChange={e => setEditedMaterial(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300">
                  {editedMaterial.notes || 'No notes'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 