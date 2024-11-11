import { Material, Vendor } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { UI } from '@/lib/constants/ui'

interface MaterialListProps {
  materials: Material[]
  onSelect: (material: Material) => void
}

type SortField = 'vendor_ref_id' | 'price' | 'created_date'
type SortDirection = 'asc' | 'desc'

export default function MaterialList({ materials = [], onSelect }: MaterialListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  if (materials.length === 0) {
    return (
      <div className={UI.emptyState.container}>
        <h3 className={UI.emptyState.title}>No Materials Found</h3>
        <p className={UI.emptyState.description}>
          Create your first material to get started.
        </p>
      </div>
    )
  }

  // Filter Materials
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = 
      material.vendor_ref_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.price.toString().includes(searchTerm)

    return matchesSearch
  })

  // Sort Materials
  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case 'vendor_ref_id':
        comparison = (a.vendor_ref_id || '').localeCompare(b.vendor_ref_id || '')
        break
      case 'price':
        comparison = a.price - b.price
        break
      case 'created_date':
        comparison = new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
        break
    }
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Calculate summary stats
  const totalMaterials = filteredMaterials.length
  const totalValue = filteredMaterials.reduce((sum, material) => sum + material.price, 0)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  return (
    <div className={UI.containers.section}>
      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search materials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Summary Stats */}
      <div className={UI.containers.statsGrid}>
        <div className={UI.statsCard.container}>
          <h3 className={UI.statsCard.label}>Total Materials</h3>
          <p className={UI.statsCard.value}>{totalMaterials}</p>
        </div>
        <div className={UI.statsCard.container}>
          <h3 className={UI.statsCard.label}>Total Value</h3>
          <p className={UI.statsCard.value}>${totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={sortField === 'vendor_ref_id' ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => handleSort('vendor_ref_id')}
        >
          Reference # {sortField === 'vendor_ref_id' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
        <Button
          variant={sortField === 'price' ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => handleSort('price')}
        >
          Price {sortField === 'price' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
        <Button
          variant={sortField === 'created_date' ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => handleSort('created_date')}
        >
          Date {sortField === 'created_date' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
      </div>

      {/* Material List */}
      <div className="space-y-4">
        {sortedMaterials.map((material) => (
          <div 
            key={material.material_id} 
            className={cn(UI.listItem.base, UI.listItem.interactive)}
            onClick={() => onSelect(material)}
          >
            <div className={UI.listItem.header}>
              <div>
                <h3 className={UI.text.title}>
                  {material.vendor.vendor_name}
                </h3>
                {material.vendor_ref_id && (
                  <p className={UI.text.subtitle}>
                    Ref: {material.vendor_ref_id}
                  </p>
                )}
                {material.notes && (
                  <p className={UI.text.subtitle}>
                    {material.notes}
                  </p>
                )}
                {material.length && (
                  <Badge variant="secondary" className="mt-2">
                    Length: {material.length}m
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <p className={UI.text.title}>
                  ${material.price.toLocaleString()}
                </p>
                <p className={UI.text.subtitle + " mt-2"}>
                  Created: {new Date(material.created_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 