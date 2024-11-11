'use client'

import { UI } from '@/lib/constants/ui'
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
    <div className={UI.containers.section}>
      {Object.entries(differences).map(([key, diffs]) => (
        <Card key={key}>
          <CardContent className={UI.containers.cardContent}>
            <h3 className={cn(UI.text.title, "mb-4")}>
              GWD #{diffs[0].gwd_number}
              {diffs[0].isNew && (
                <span className={UI.text.success + " ml-2"}>
                  (New Record)
                </span>
              )}
            </h3>
            <div className="space-y-2">
              {diffs.map((diff, index) => (
                <div 
                  key={index} 
                  className={cn(
                    UI.containers.comparison,
                    "flex items-center gap-4 p-2 rounded"
                  )}
                >
                  <span className={cn(UI.text.label, "w-1/4")}>
                    {diff.field}
                  </span>
                  <div className="flex-1 flex gap-4">
                    {!diff.isNew && (
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1",
                          UI.button.comparison.existing
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
                          ? UI.button.comparison.new
                          : UI.button.comparison.imported
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