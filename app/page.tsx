import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  console.log('Root page - Session:', session?.user?.email || 'No session found');

  if (!session) {
    console.log('Root page - Redirecting to /sign-in');
    return redirect('/sign-in')
  }

  console.log('Root page - Redirecting to /protected/dashboard');
  return redirect('/protected/dashboard')
}