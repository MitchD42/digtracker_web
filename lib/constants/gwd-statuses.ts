export const GWD_STATUSES = {
  'Site Selected': 'Site Selected',
  'With CLEIR': 'With CLEIR',
  'CLEIR Approved': 'CLEIR Approved',
  'Dig Completed': 'Dig Completed',
  'Dig Cancelled': 'Dig Cancelled',
  'Dig Postponed': 'Dig Postponed',
  'Dig Report Received': 'Dig Report Received'
} as const

export type GWDStatus = keyof typeof GWD_STATUSES

// Update the order here
export const GWD_STATUS_OPTIONS = [
  'Site Selected',
  'With CLEIR',
  'CLEIR Approved',
  'Dig Completed',
  'Dig Cancelled',
  'Dig Postponed',
  'Dig Report Received'
] as const
  