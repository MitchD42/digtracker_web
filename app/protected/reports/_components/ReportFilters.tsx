'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UI } from '@/lib/constants/ui'
import { useState } from 'react'

interface ReportFiltersProps {
  onFilterChange?: (filters: any) => void
}

export function ReportFilters({ onFilterChange }: ReportFiltersProps) {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    afe: ''
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    onFilterChange?.(filters)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={UI.text.title}>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range */}
        <div className="space-y-2">
          <Label className={UI.text.label}>Date Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input 
              type="date" 
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
            <Input 
              type="date" 
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label className={UI.text.label}>Status</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* AFE Filter */}
        <div className="space-y-2">
          <Label className={UI.text.label}>AFE</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select AFE" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All AFEs</SelectItem>
              {/* We'll populate this dynamically later */}
            </SelectContent>
          </Select>
        </div>

        {/* Apply Filters Button */}
        <Button onClick={handleApplyFilters}>Apply Filters</Button>
      </CardContent>
    </Card>
  )
} 