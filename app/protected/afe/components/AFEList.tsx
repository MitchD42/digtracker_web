import { AFE, AFEWithPipelines, System, AFEStatus } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { ArrowUpDown, AlertTriangle, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AFEListProps {
  afes: AFEWithPipelines[]
  systems: System[]
  onSelect: (afe: AFEWithPipelines) => void
}

type SortField = 'afe_number' | 'status' | 'budget' | 'current_costs'
type SortDirection = 'asc' | 'desc'

export default function AFEList({ afes = [], systems = [], onSelect }: AFEListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | AFEStatus>('all')
  const [systemFilter, setSystemFilter] = useState<number | 'all'>('all')
  const [sortField, setSortField] = useState<SortField>('afe_number')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const getSystemName = (systemId: number) => {
    if (!systems) return 'Unknown System'
    return systems.find(s => s.system_id === systemId)?.system_name || 'Unknown System'
  }

  if (systems.length === 0) {
    return (
      <div className="p-6 text-center border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-medium mb-2">No Systems Available</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          You need to set up at least one system before creating AFEs.
        </p>
        <Button 
          onClick={() => window.location.href = '/protected/systems'}
          className="inline-flex items-center"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Your First System
        </Button>
      </div>
    )
  }

  if (afes.length === 0) {
    return (
      <div className="p-6 text-center border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-medium mb-2">No AFEs Found</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Create your first AFE to get started.
        </p>
      </div>
    )
  }

  // Filter AFEs
  const filteredAFEs = afes.filter(afe => {
    const matchesSearch = 
      afe.afe_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      afe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSystemName(afe.system_id).toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || afe.status === statusFilter
    const matchesSystem = systemFilter === 'all' || afe.system_id === systemFilter

    return matchesSearch && matchesStatus && matchesSystem
  })

  // Sort AFEs
  const sortedAFEs = [...filteredAFEs].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case 'afe_number':
        comparison = a.afe_number.localeCompare(b.afe_number)
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
      case 'budget':
        comparison = a.budget - b.budget
        break
      case 'current_costs':
        comparison = a.current_costs - b.current_costs
        break
    }
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Calculate summary stats
  const totalBudget = filteredAFEs.reduce((sum, afe) => sum + afe.budget, 0)
  const totalCosts = filteredAFEs.reduce((sum, afe) => sum + afe.current_costs, 0)
  const draftCount = filteredAFEs.filter(afe => afe.status === 'Draft').length
  const activeCount = filteredAFEs.filter(afe => afe.status === 'Active').length

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
          placeholder="Search AFEs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="border rounded-md px-3 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | AFEStatus)}
        >
          <option value="all">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Active">Active</option>
          <option value="Complete">Complete</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select
          className="border rounded-md px-3 py-2"
          value={systemFilter}
          onChange={(e) => setSystemFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        >
          <option value="all">All Systems</option>
          {systems?.map(system => (
            <option key={system.system_id} value={system.system_id}>
              {system.system_name}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Budget</h3>
          <p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Costs</h3>
          <p className="text-2xl font-bold">${totalCosts.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Draft</h3>
          <p className="text-2xl font-bold">{draftCount}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active</h3>
          <p className="text-2xl font-bold">{activeCount}</p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort('afe_number')}
          className={sortField === 'afe_number' ? 'bg-gray-100' : ''}
        >
          AFE # {sortField === 'afe_number' && <ArrowUpDown className="ml-2 h-4 w-4" />}
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
          onClick={() => handleSort('budget')}
          className={sortField === 'budget' ? 'bg-gray-100' : ''}
        >
          Budget {sortField === 'budget' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSort('current_costs')}
          className={sortField === 'current_costs' ? 'bg-gray-100' : ''}
        >
          Costs {sortField === 'current_costs' && <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
      </div>

      {/* AFE List */}
      <div className="space-y-4">
        {sortedAFEs.map((afe) => {
          const isOverBudget = afe.current_costs > afe.budget

          return (
            <div 
              key={afe.afe_id} 
              className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => onSelect(afe)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{afe.afe_number}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {afe.description}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    System: {getSystemName(afe.system_id)}
                  </p>
                  {afe.afe_pipelines && afe.afe_pipelines.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {afe.afe_pipelines.map(afePipeline => (
                        <Badge 
                          key={afePipeline.afe_pipeline_id} 
                          variant="secondary"
                          className="text-xs"
                        >
                          {afePipeline.pipeline.pipeline_name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Badge 
                      variant={
                        afe.status === 'Complete' ? 'default' :
                        afe.status === 'Active' ? 'secondary' :
                        afe.status === 'Cancelled' ? 'destructive' :
                        'outline'
                      }
                    >
                      {afe.status}
                    </Badge>
                    {isOverBudget && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Over Budget
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium mt-2">Budget: ${afe.budget.toLocaleString()}</p>
                  <p className={`text-sm ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
                    Current Costs: ${afe.current_costs.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 