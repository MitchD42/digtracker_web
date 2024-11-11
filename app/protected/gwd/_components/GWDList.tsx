import { GWDWithAFE } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { ArrowUpDown, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { X, Check } from 'lucide-react'
import { cn } from "@/lib/utils"
import { UI } from '@/lib/constants/ui'

interface GWDListProps {
  gwds: GWDWithAFE[]
  onSelect: (gwd: GWDWithAFE) => void
}

type SortField = 'gwd_number' | 'status' | 'initial_budget' | 'total_cost'
type SortDirection = 'asc' | 'desc'

const FilterButtonGroup = ({ 
  options, 
  selected, 
  onChange,
  label 
}: { 
  options: string[]
  selected: string[]
  onChange: (value: string[]) => void
  label: string
}) => {
  return (
    <div className="space-y-2">
      <h3 className={UI.text.label}>{label}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option}
            variant={selected.includes(option) ? "default" : "outline"}
            size="sm"
            onClick={() => {
              onChange(
                selected.includes(option)
                  ? selected.filter(item => item !== option)
                  : [...selected, option]
              )
            }}
            className="whitespace-nowrap"
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  )
}

const STATUS_VARIANTS = {
  Complete: 'default',
  'In Progress': 'secondary',
  Cancelled: 'destructive',
  default: 'outline'
} as const

export default function GWDList({ gwds, onSelect }: GWDListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [systemFilters, setSystemFilters] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('gwd_number')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showFilters, setShowFilters] = useState(false)

  // Get unique systems for filter
  const systems = Array.from(new Set(gwds.map(gwd => gwd.system).filter((system): system is string => system !== null)))

  // Filter GWDs
  const filteredGWDs = gwds.filter(gwd => {
    const matchesSearch = 
      gwd.gwd_number.toString().includes(searchTerm) ||
      gwd.system?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gwd.pipeline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gwd.afe?.afe_number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(gwd.status || '')
    const matchesSystem = systemFilters.length === 0 || systemFilters.includes(gwd.system || '')

    return matchesSearch && matchesStatus && matchesSystem
  })

  // Sort GWDs
  const sortedGWDs = [...filteredGWDs].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case 'gwd_number':
        comparison = a.gwd_number - b.gwd_number
        break
      case 'status':
        comparison = (a.status || '').localeCompare(b.status || '')
        break
      case 'initial_budget':
        comparison = a.initial_budget - b.initial_budget
        break
      case 'total_cost':
        const aTotalCost = a.land_cost + a.dig_cost
        const bTotalCost = b.land_cost + b.dig_cost
        comparison = aTotalCost - bTotalCost
        break
    }
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Calculate summary stats
  const totalBudget = filteredGWDs.reduce((sum, gwd) => sum + gwd.initial_budget, 0)
  const totalCost = filteredGWDs.reduce((sum, gwd) => sum + gwd.land_cost + gwd.dig_cost, 0)
  const completedCount = filteredGWDs.filter(gwd => gwd.status === 'Complete').length
  const inProgressCount = filteredGWDs.filter(gwd => gwd.status === 'In Progress').length

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const STATUS_OPTIONS = [
    "Ready",
    "Cancelled",
    "Complete",
    "On Hold",
    "Not Started",
    "Waiting for CLEIR"
  ]

  return (
    <div className={UI.containers.list}>
      {/* Filters Section */}
      <div className={UI.containers.card}>
        <Button
          variant="ghost"
          className="w-full flex justify-between p-4"
          onClick={() => setShowFilters(!showFilters)}
        >
          <span className={UI.text.title}>Filters</span>
          {showFilters ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        
        {showFilters && (
          <div className={UI.containers.cardContent}>
            <Input
              placeholder="Search GWDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <div className={UI.containers.grid}>
              <FilterButtonGroup
                options={STATUS_OPTIONS}
                selected={statusFilters}
                onChange={setStatusFilters}
                label="Filter by Status"
              />
              
              <FilterButtonGroup
                options={systems}
                selected={systemFilters}
                onChange={setSystemFilters}
                label="Filter by System"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className={UI.containers.statsGrid}>
        <div className={UI.statsCard.container}>
          <h3 className={UI.statsCard.label}>Total Budget</h3>
          <p className={UI.statsCard.value}>${totalBudget.toLocaleString()}</p>
        </div>
        <div className={UI.statsCard.container}>
          <h3 className={UI.statsCard.label}>Total Cost</h3>
          <p className={UI.statsCard.value}>${totalCost.toLocaleString()}</p>
        </div>
        <div className={UI.statsCard.container}>
          <h3 className={UI.statsCard.label}>Completed</h3>
          <p className={UI.statsCard.value}>{completedCount}</p>
        </div>
        <div className={UI.statsCard.container}>
          <h3 className={UI.statsCard.label}>In Progress</h3>
          <p className={UI.statsCard.value}>{inProgressCount}</p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className={UI.containers.controls}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort('gwd_number')}
          className={sortField === 'gwd_number' ? UI.button.active : ''}
        >
          GWD # {sortField === 'gwd_number' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort('status')}
          className={sortField === 'status' ? UI.button.active : ''}
        >
          Status {sortField === 'status' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort('initial_budget')}
          className={sortField === 'initial_budget' ? UI.button.active : ''}
        >
          Budget {sortField === 'initial_budget' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort('total_cost')}
          className={sortField === 'total_cost' ? UI.button.active : ''}
        >
          Cost {sortField === 'total_cost' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
      </div>

      {/* GWD List */}
      <div className="space-y-4">
        {sortedGWDs.map((gwd) => {
          const totalCost = gwd.land_cost + gwd.dig_cost
          const isOverBudget = totalCost > gwd.initial_budget

          return (
            <div 
              key={gwd.gwd_id} 
              className={`${UI.listItem.base} ${UI.listItem.interactive}`}
              onClick={() => onSelect(gwd)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={UI.text.title}>GWD #{gwd.gwd_number}</h3>
                  <p className={UI.text.subtitle}>
                    AFE: {gwd.afe?.afe_number || 'No AFE'}
                  </p>
                  <p className={UI.text.subtitle + " mt-1"}>
                    System: {gwd.system || 'N/A'} {gwd.pipeline && `• ${gwd.pipeline}`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Badge 
                      variant={STATUS_VARIANTS[gwd.status as keyof typeof STATUS_VARIANTS] || STATUS_VARIANTS.default}
                    >
                      {gwd.status}
                    </Badge>
                    {isOverBudget && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Over Budget
                      </Badge>
                    )}
                  </div>
                  <p className={UI.text.title + " mt-2"}>Budget: ${gwd.initial_budget.toLocaleString()}</p>
                  <p className={`${UI.text.subtitle} ${isOverBudget ? 'text-destructive' : ''}`}>
                    Total Cost: ${totalCost.toLocaleString()}
                  </p>
                  <div className={UI.text.subtitle + " mt-1"}>
                    {gwd.dig_name && `Dig: ${gwd.dig_name} • `}
                    {gwd.execution_year && `Year: ${gwd.execution_year} • `}
                    {gwd.inspection_provider && `Inspector: ${gwd.inspection_provider}`}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 