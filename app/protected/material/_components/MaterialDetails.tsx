import { useState } from 'react'
import { Material, Vendor } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'
import { X, Edit2, Save, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { UI } from '@/lib/constants/ui'

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
    <div className={UI.containers.section}>
      {error && (
        <div className={UI.containers.errorBox}>
          {error}
        </div>
      )}

      <div className="flex justify-between items-start">
        <div>
          <h2 className={UI.text.title + " text-2xl"}>{material.vendor.vendor_name}</h2>
          <p className={UI.text.subtitle}>
            Created: {new Date(material.created_date).toLocaleDateString()}
          </p>
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
              <Label className={UI.text.label}>Vendor Reference ID</Label>
              {isEditing ? (
                <Input
                  value={editedMaterial.vendor_ref_id || ''}
                  onChange={e => setEditedMaterial(prev => ({ 
                    ...prev, 
                    vendor_ref_id: e.target.value 
                  }))}
                />
              ) : (
                <p className={UI.text.subtitle}>
                  {editedMaterial.vendor_ref_id || 'N/A'}
                </p>
              )}
            </div>

            <div>
              <Label className={UI.text.label}>Price</Label>
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
                <p className={UI.text.subtitle}>
                  ${editedMaterial.price.toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <Label className={UI.text.label}>Length (ft)</Label>
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
                <p className={UI.text.subtitle}>
                  {editedMaterial.length ? `${editedMaterial.length} ft` : 'N/A'}
                </p>
              )}
            </div>

            <div>
              <Label className={UI.text.label}>Notes</Label>
              {isEditing ? (
                <Input
                  value={editedMaterial.notes || ''}
                  onChange={e => setEditedMaterial(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                />
              ) : (
                <p className={UI.text.subtitle}>
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