import { useState, useMemo } from 'react'
import { GWDWithAFE, AFEWithPipelines } from '@/types/database'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Save, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react'

interface GWDMassEditProps {
  gwds: GWDWithAFE[]
  afes: AFEWithPipelines[]
  onUpdate: () => void
}

interface EditableCell {
  gwd_id: number
  field: string
  value: any
}

const STATUS_MAP = {
  'CLEIR Approved': 'Ready',
  'Dig Cancelled': 'Cancelled',
  'Dig Completed': 'Complete',
  'Dig Postponed': 'On Hold',
  'Dig Report Received': 'Complete',
  'Site Selected': 'Not Started',
  'With CLEIR': 'Waiting for CLEIR'
} as const

const STATUS_OPTIONS = [
  "Ready",
  "Cancelled",
  "Complete",
  "On Hold",
  "Not Started",
  "Waiting for CLEIR"
]

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

export default function GWDMassEdit({ gwds, afes, onUpdate }: GWDMassEditProps) {
  const [editedCells, setEditedCells] = useState<EditableCell[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [systemFilters, setSystemFilters] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField] = useState<SortField>('gwd_number')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [localGWDs, setLocalGWDs] = useState<GWDWithAFE[]>([])
  const [isFiltersApplied, setIsFiltersApplied] = useState(false)
  const supabase = createClient()

  // Get unique systems from the original gwds array
  const systems = Array.from(new Set(gwds.map(gwd => gwd.system).filter((system): system is string => system !== null)))

  // Apply filters only when the Apply button is clicked
  const handleApplyFilters = () => {
    const filtered = gwds.filter(gwd => {
      const matchesSearch = searchTerm === '' || 
        gwd.gwd_number.toString().includes(searchTerm) ||
        gwd.system?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gwd.pipeline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gwd.afe?.afe_number.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(gwd.status || '')
      const matchesSystem = systemFilters.length === 0 || systemFilters.includes(gwd.system || '')

      return matchesSearch && matchesStatus && matchesSystem
    })

    setLocalGWDs(filtered)
    setIsFiltersApplied(true)
  }

  // Reset filters and clear displayed data
  const handleResetFilters = () => {
    setSearchTerm('')
    setStatusFilters([])
    setSystemFilters([])
    setLocalGWDs([])
    setIsFiltersApplied(false)
  }

  // Sort the filtered GWDs
  const displayGWDs = useMemo(() => {
    return [...localGWDs].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'gwd_number':
          comparison = a.gwd_number - b.gwd_number
          break
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '')
          break
        case 'initial_budget':
          comparison = (a.initial_budget || 0) - (b.initial_budget || 0)
          break
        case 'total_cost':
          const aTotalCost = (a.land_cost || 0) + (a.dig_cost || 0)
          const bTotalCost = (b.land_cost || 0) + (b.dig_cost || 0)
          comparison = aTotalCost - bTotalCost
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [localGWDs, sortField, sortDirection])

  const handleCellEdit = (gwd_id: number, field: string, value: any) => {
    // Update editedCells for saving to database later
    setEditedCells(prev => {
      const existing = prev.findIndex(cell => cell.gwd_id === gwd_id && cell.field === field)
      if (existing !== -1) {
        const updated = [...prev]
        updated[existing].value = value
        return updated
      }
      return [...prev, { gwd_id, field, value }]
    })

    // Update local GWD data for immediate display
    setLocalGWDs(prev => prev.map(gwd => 
      gwd.gwd_id === gwd_id 
        ? { ...gwd, [field]: value }
        : gwd
    ))
  }

  const saveChanges = async () => {
    try {
      // Group changes by GWD ID for efficient updates
      const changesByGWD = editedCells.reduce((acc, cell) => {
        if (!acc[cell.gwd_id]) acc[cell.gwd_id] = {}
        acc[cell.gwd_id][cell.field] = cell.value
        return acc
      }, {} as Record<number, Record<string, any>>)

      // Perform updates
      for (const [gwd_id, changes] of Object.entries(changesByGWD)) {
        const { error } = await supabase
          .from('gwds')
          .update(changes)
          .eq('gwd_id', gwd_id)

        if (error) throw error
      }

      // Clear edited cells and refresh data
      setEditedCells([])
      onUpdate()
    } catch (error) {
      console.error('Error saving changes:', error)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <div className="space-y-4">
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className="w-full justify-between"
        >
          <span>Selection</span>
          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {showFilters && (
          <div className="space-y-4 p-4 border rounded-lg">
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

            <div className="flex gap-2">
              <Button onClick={handleApplyFilters}>
                Apply Selection
              </Button>
              <Button variant="outline" onClick={handleResetFilters}>
                Reset
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Show message when no filters are applied */}
      {!isFiltersApplied && (
        <div className="text-center p-8 text-gray-500">
          Please select filters and click Apply to view GWDs
        </div>
      )}

      {/* Only show table when filters are applied */}
      {isFiltersApplied && (
        <>
          {/* Save Changes Button */}
          <div className="flex justify-end sticky top-0 bg-white dark:bg-gray-900 z-10 py-2">
            <Button
              onClick={saveChanges}
              disabled={editedCells.length === 0}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes ({editedCells.length})
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <div className="overflow-auto max-h-[calc(100vh-300px)] relative">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="p-2 text-left sticky left-0 bg-gray-100 dark:bg-gray-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('gwd_number')}
                        className="flex items-center gap-2 -ml-3"
                      >
                        GWD # 
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </th>
                    <th className="p-2 text-left">System</th>
                    <th className="p-2 text-left">Pipeline</th>
                    <th className="p-2 text-left">AFE</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Budget</th>
                    <th className="p-2 text-left">Land Cost</th>
                    <th className="p-2 text-left">Dig Cost</th>
                    <th className="p-2 text-left">Inspector</th>
                    <th className="p-2 text-left">Project Engineer</th>
                    <th className="p-2 text-left">Completion Date</th>
                    <th className="p-2 text-left">Inspection Start</th>
                    <th className="p-2 text-left">Start Relative</th>
                    <th className="p-2 text-left">End Relative</th>
                    <th className="p-2 text-left">Length</th>
                  </tr>
                </thead>
                <tbody>
                  {displayGWDs.map((gwd) => (
                    <tr key={gwd.gwd_id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-2 sticky left-0 bg-white dark:bg-gray-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        {gwd.gwd_number}
                      </td>
                      <td className="p-2">{gwd.system}</td>
                      <td className="p-2">{gwd.pipeline}</td>
                      <td className="p-2">
                        <Select
                          value={gwd.afe_id ? String(gwd.afe_id) : undefined}
                          onValueChange={(value) => handleCellEdit(gwd.gwd_id, 'afe_id', parseInt(value))}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue>
                              {afes.find(afe => afe.afe_id === gwd.afe_id)?.afe_number || 'Select AFE'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {afes.map(afe => (
                              <SelectItem key={afe.afe_id} value={String(afe.afe_id)}>
                                {afe.afe_number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Select
                          value={gwd.status || undefined}
                          onValueChange={(value) => handleCellEdit(gwd.gwd_id, 'status', value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue>
                              {gwd.status || 'Select status'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(status => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={gwd.initial_budget || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseFloat(e.target.value)
                            handleCellEdit(gwd.gwd_id, 'initial_budget', value)
                          }}
                          className="w-[120px]"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={gwd.land_cost || ''}
                          onChange={(e) => handleCellEdit(gwd.gwd_id, 'land_cost', parseFloat(e.target.value))}
                          className="w-[120px]"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={gwd.dig_cost || ''}
                          onChange={(e) => handleCellEdit(gwd.gwd_id, 'dig_cost', parseFloat(e.target.value))}
                          className="w-[120px]"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="text"
                          value={gwd.inspection_provider || ''}
                          onChange={(e) => handleCellEdit(gwd.gwd_id, 'inspection_provider', e.target.value || null)}
                          className="w-[150px]"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="text"
                          value={gwd.project_engineer || ''}
                          onChange={(e) => handleCellEdit(gwd.gwd_id, 'project_engineer', e.target.value)}
                          className="w-[150px]"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="date"
                          value={gwd.inspection_completion_date || ''}
                          onChange={(e) => handleCellEdit(gwd.gwd_id, 'inspection_completion_date', e.target.value || null)}
                          className="w-[150px]"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={gwd.actual_inspection_start || ''}
                          onChange={(e) => handleCellEdit(gwd.gwd_id, 'actual_inspection_start', parseFloat(e.target.value))}
                          className="w-[150px]"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={gwd.actual_inspection_start_relative || ''}
                          onChange={(e) => handleCellEdit(gwd.gwd_id, 'actual_inspection_start_relative', parseFloat(e.target.value))}
                          className="w-[100px]"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={gwd.actual_inspection_end_relative || ''}
                          onChange={(e) => handleCellEdit(gwd.gwd_id, 'actual_inspection_end_relative', parseFloat(e.target.value))}
                          className="w-[100px]"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={gwd.actual_inspection_length || ''}
                          onChange={(e) => handleCellEdit(gwd.gwd_id, 'actual_inspection_length', parseFloat(e.target.value))}
                          className="w-[100px]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 