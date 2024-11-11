// Common UI patterns and styles
export const UI = {
  containers: {
    section: "space-y-4",
    card: "p-4 border rounded-lg",
    errorBox: "p-4 text-destructive bg-destructive/10 rounded-md",
    emptyState: "p-6 text-center border rounded-lg bg-muted",
    searchGrid: "grid grid-cols-3 gap-4 mb-6",
    statsGrid: "grid grid-cols-4 gap-4 mb-6",
    sortControls: "flex gap-2 mb-4",
    list: "space-y-4",
    cardContent: "p-4 border-t space-y-4",
    grid: "grid grid-cols-1 md:grid-cols-2 gap-4",
    controls: "flex gap-2 mb-4",
    comparison: "bg-muted",
    loading: "flex items-center justify-center p-8 text-gray-500"
  },
  
  inputs: {
    select: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
  },

  listItem: {
    base: "p-4 border rounded-lg transition-colors",
    interactive: "hover:bg-accent hover:text-accent-foreground cursor-pointer",
    header: "flex justify-between items-start",
  },

  text: {
    title: "font-semibold text-foreground",
    subtitle: "text-sm text-muted-foreground",
    label: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    success: "text-green-500 dark:text-green-400"
  },

  statsCard: {
    container: "bg-card p-4 rounded-lg",
    label: "text-sm font-medium text-muted-foreground",
    value: "text-2xl font-bold text-foreground",
  },

  emptyState: {
    container: "p-6 text-center border rounded-lg bg-muted",
    title: "text-lg font-medium mb-2",
    description: "text-muted-foreground mb-4",
  },

  button: {
    active: "bg-accent",
    comparison: {
      existing: "hover:bg-green-50 dark:hover:bg-green-900",
      imported: "hover:bg-blue-50 dark:hover:bg-blue-900",
      new: "bg-primary hover:bg-primary/90 text-primary-foreground"
    }
  }
} 