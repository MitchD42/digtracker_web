"use client"

import * as React from "react"
import { format } from "date-fns"

interface DatePickerProps {
  date?: Date
  setDate?: (date?: Date) => void
}

export function DatePicker({ date, setDate }: DatePickerProps = {}) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined
    setDate?.(newDate)
  }

  return (
    <input
      type="date"
      value={date ? format(date, "yyyy-MM-dd") : ""}
      onChange={handleDateChange}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    />
  )
}