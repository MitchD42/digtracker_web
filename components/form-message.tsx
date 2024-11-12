'use client'

import { Alert, AlertDescription } from "@/components/ui/alert"

export type Message =
  | { success: string }
  | { error: string }
  | { message: string }
  | null;

export function FormMessage({ message }: { message: Message }) {
  // Return null if message is null or if all properties are null/undefined/empty
  if (!message || Object.values(message).every(val => !val)) return null;

  return (
    <div className="w-full">
      {"success" in message && message.success && (
        <Alert variant="default">
          <AlertDescription>{message.success}</AlertDescription>
        </Alert>
      )}
      {"error" in message && message.error && (
        <Alert variant="destructive">
          <AlertDescription>{message.error}</AlertDescription>
        </Alert>
      )}
      {"message" in message && message.message && (
        <Alert>
          <AlertDescription>{message.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
