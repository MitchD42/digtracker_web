"use client"

import { GWDMetrics } from "@/utils/supabase/dashboard-queries"

interface GWDStatusChartProps {
  data?: GWDMetrics
}

export function GWDStatusChart({ data }: GWDStatusChartProps = {}) {
  // Implement your chart here
  return (
    <div className="w-full h-[300px] flex items-center justify-center">
      GWD Status Chart
      {data && (
        <div>
          Total GWDs: {data.totalCount}
        </div>
      )}
    </div>
  )
} 