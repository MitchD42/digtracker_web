import { GWDStatus } from './gwd-statuses'

export const GWD_STATUS_COLORS: Record<GWDStatus, string> = {
  'CLEIR Approved': '#22c55e',
  'Dig Cancelled': '#ef4444',
  'Dig Completed': '#3b82f6',
  'Dig Postponed': '#eab308',
  'Dig Report Received': '#8b5cf6',
  'Site Selected': '#f97316',
  'With CLEIR': '#06b6d4'
} as const 