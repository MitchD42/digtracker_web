'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import React from 'react'

interface Difference {
  gwd_id: number | null
  gwd_number: number
  field: string
  existing: any
  imported: any
  isNew?: boolean
}

interface GWDComparisonProps {
  differences: {
    [key: string]: Difference[]
  }
  onResolution: (gwd_id: number | null, field: string, value: any, isNew?: boolean) => void
}

export default function GWDComparison({ differences, onResolution }: GWDComparisonProps) {
  React.useEffect(() => {
    console.log('🔄 GWDComparison mounted with differences:', {
      keys: Object.keys(differences),
      count: Object.keys(differences).length,
      sample: Object.entries(differences)[0]
    })
    
    return () => {
      console.log('❌ GWDComparison unmounted')
    }
  }, [differences])

  console.log('📊 GWDComparison rendering with:', {
    diffKeys: Object.keys(differences),
    diffCount: Object.keys(differences).length
  })

  return (
    <div className="space-y-4">
      {Object.entries(differences).map(([key, diffs]) => (
        <Card key={key}>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">
              GWD #{diffs[0].gwd_number}
              {diffs[0].isNew && <span className="ml-2 text-green-500">(New Record)</span>}
            </h3>
            <div className="space-y-2">
              {diffs.map((diff, index) => (
                <div key={index} className="flex items-center gap-4 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="font-medium w-1/4">{diff.field}</span>
                  <div className="flex-1 flex gap-4">
                    {!diff.isNew && (
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1",
                          "hover:bg-green-50 dark:hover:bg-green-900"
                        )}
                        onClick={() => onResolution(diff.gwd_id!, diff.field, diff.existing)}
                      >
                        Existing: {JSON.stringify(diff.existing)}
                      </Button>
                    )}
                    <Button
                      variant={diff.isNew ? "default" : "outline"}
                      className={cn(
                        "flex-1",
                        diff.isNew 
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : "hover:bg-blue-50 dark:hover:bg-blue-900"
                      )}
                      onClick={() => onResolution(diff.gwd_id, diff.field, diff.imported, diff.isNew)}
                    >
                      {diff.isNew ? "Insert New Record" : `Imported: ${JSON.stringify(diff.imported)}`}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 