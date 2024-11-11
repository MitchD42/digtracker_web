'use client'

import { useState } from 'react'
import { POWithDetails } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowUpDown } from 'lucide-react'

interface POListProps {
  pos: POWithDetails[]
  onSelect: (po: POWithDetails) => void
}

type SortField = 'po_number' | 'status' | 'initial_value' | 'total_value'
type SortDirection = 'asc' | 'desc'

export default function POList({ pos, onSelect }: POListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Open' | 'Closed'>('all')
  const [afeFilter, setAfeFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('po_number')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Get unique AFEs for filter
  const afes = Array.from(new Set(pos.map(po => po.afe.afe_number)))

  // Filter POs
  const filteredPOs = pos.filter(po => {
    const matchesSearch = 
      po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.afe.afe_number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || po.status === statusFilter
    const matchesAFE = afeFilter === 'all' || po.afe.afe_number === afeFilter

    return matchesSearch && matchesStatus && matchesAFE
  })

  // Sort POs
  const sortedPOs = [...filteredPOs].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case 'po_number':
        comparison = a.po_number.localeCompare(b.po_number)
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
      case 'initial_value':
        comparison = a.initial_value - b.initial_value
        break
      case 'total_value':
        comparison = a.total_value - b.total_value
        break
    }
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Calculate summary stats
  const totalValue = filteredPOs.reduce((sum, po) => sum + po.total_value, 0)
  const openCount = filteredPOs.filter(po => po.status === 'Open').length
  const closedCount = filteredPOs.filter(po => po.status === 'Closed').length

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
      {/* Search and Filters */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Input
          placeholder="Search POs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="border rounded-md px-3 py-2 bg-background"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'Open' | 'Closed')}
        >
          <option value="all">All Status</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
        </select>
        <select
          className="border rounded-md px-3 py-2"
          value={afeFilter}
          onChange={(e) => setAfeFilter(e.target.value)}
        >
          <option value="all">All AFEs</option>
          {afes.map(afe => (
            <option key={afe} value={afe}>{afe}</option>
          ))}
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="text-sm font-medium text-muted-foreground">Total Value</h3>
          <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="text-sm font-medium text-muted-foreground">Open POs</h3>
          <p className="text-2xl font-bold">{openCount}</p>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="text-sm font-medium text-muted-foreground">Closed POs</h3>
          <p className="text-2xl font-bold">{closedCount}</p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort('po_number')}
          className={sortField === 'po_number' ? 'bg-accent' : ''}
        >
          PO # {sortField === 'po_number' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort('status')}
          className={sortField === 'status' ? 'bg-accent' : ''}
        >
          Status {sortField === 'status' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort('initial_value')}
          className={sortField === 'initial_value' ? 'bg-accent' : ''}
        >
          Initial Value {sortField === 'initial_value' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort('total_value')}
          className={sortField === 'total_value' ? 'bg-accent' : ''}
        >
          Total Value {sortField === 'total_value' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
      </div>

      {/* PO List */}
      <div className="space-y-4">
        {sortedPOs.map((po) => (
          <div 
            key={po.po_id} 
            className="p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
            onClick={() => onSelect(po)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">PO #{po.po_number}</h3>
                <p className="text-sm text-muted-foreground">
                  AFE: {po.afe.afe_number}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Vendor: {po.vendor.vendor_name}
                </p>
              </div>
              <div className="text-right">
                <Badge variant={po.status === 'Open' ? 'default' : 'secondary'}>
                  {po.status}
                </Badge>
                <p className="font-medium mt-2">
                  Initial: ${po.initial_value.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total: ${po.total_value.toLocaleString()}
                </p>
                {po.change_orders.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {po.change_orders.length} change order(s)
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 