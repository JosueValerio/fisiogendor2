import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  const subscriptionStatus = (profile?.subscription_status as string) ?? 'inactive'

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''

  if (subscriptionStatus !== 'active' && !pathname.startsWith('/settings')) {
    redirect('/settings?subscription=required')
  }

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
