import { Material, Vendor } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
      <div className="p-6 text-center border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-medium mb-2">No Materials Found</h3>
        <p className="text-gray-600 dark:text-gray-300">
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
    <div className="space-y-4">
      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search materials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Materials</h3>
          <p className="text-2xl font-bold">{totalMaterials}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Value</h3>
          <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort('vendor_ref_id')}
          className={sortField === 'vendor_ref_id' ? 'bg-gray-100' : ''}
        >
          Reference # {sortField === 'vendor_ref_id' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort('price')}
          className={sortField === 'price' ? 'bg-gray-100' : ''}
        >
          Price {sortField === 'price' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort('created_date')}
          className={sortField === 'created_date' ? 'bg-gray-100' : ''}
        >
          Date {sortField === 'created_date' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
      </div>

      {/* Material List */}
      <div className="space-y-4">
        {sortedMaterials.map((material) => (
          <div 
            key={material.material_id} 
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            onClick={() => onSelect(material)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">
                  {material.vendor.vendor_name}
                </h3>
                {material.vendor_ref_id && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Ref: {material.vendor_ref_id}
                  </p>
                )}
                {material.notes && (
                  <p className="text-sm text-gray-500 mt-1">
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
                <p className="text-lg font-semibold">
                  ${material.price.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-2">
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