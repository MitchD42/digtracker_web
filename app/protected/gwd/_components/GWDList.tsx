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
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</h3>
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
    <div className="space-y-4">
      {/* Collapsible Filter Section */}
      <div className="border rounded-lg">
        <Button
          variant="ghost"
          className="w-full flex justify-between p-4"
          onClick={() => setShowFilters(!showFilters)}
        >
          <span className="font-medium">Filters</span>
          {showFilters ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        
        {showFilters && (
          <div className="p-4 border-t space-y-4">
            <Input
              placeholder="Search GWDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Budget</h3>
          <p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cost</h3>
          <p className="text-2xl font-bold">${totalCost.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</h3>
          <p className="text-2xl font-bold">{completedCount}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</h3>
          <p className="text-2xl font-bold">{inProgressCount}</p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort('gwd_number')}
          className={sortField === 'gwd_number' ? 'bg-gray-100' : ''}
        >
          GWD # {sortField === 'gwd_number' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort('status')}
          className={sortField === 'status' ? 'bg-gray-100' : ''}
        >
          Status {sortField === 'status' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort('initial_budget')}
          className={sortField === 'initial_budget' ? 'bg-gray-100' : ''}
        >
          Budget {sortField === 'initial_budget' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort('total_cost')}
          className={sortField === 'total_cost' ? 'bg-gray-100' : ''}
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
              className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => onSelect(gwd)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">GWD #{gwd.gwd_number}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    AFE: {gwd.afe?.afe_number || 'No AFE'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    System: {gwd.system || 'N/A'} {gwd.pipeline && `• ${gwd.pipeline}`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Badge 
                      variant={
                        gwd.status === 'Complete' ? 'default' :
                        gwd.status === 'In Progress' ? 'secondary' :
                        gwd.status === 'Cancelled' ? 'destructive' :
                        'outline'
                      }
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
                  <p className="font-medium mt-2">Budget: ${gwd.initial_budget.toLocaleString()}</p>
                  <p className={`text-sm ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
                    Total Cost: ${totalCost.toLocaleString()}
                  </p>
                  <div className="text-sm text-gray-500 mt-1">
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