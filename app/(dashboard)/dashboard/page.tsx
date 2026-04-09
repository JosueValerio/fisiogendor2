import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatsCard } from '@/components/ui/StatsCard'
import { DataTable } from '@/components/ui/DataTable'
import { Users, CalendarCheck, MessageSquare, TrendingUp } from 'lucide-react'
import type { Appointment } from '@/types'
import { AppointmentsChart } from '@/components/ui/AppointmentsChart'

async function getStats(userId: string) {
  const supabase = await createClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    { count: totalPatients },
    { data: todayAppointments },
    { count: todayMessages },
    { data: recentAppointments },
    { data: last30days },
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('appointments').select('*, patient:patients(name, phone)').eq('user_id', userId)
      .gte('datetime', todayStart.toISOString()).lte('datetime', todayEnd.toISOString()).neq('status', 'cancelled'),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('user_id', userId)
      .gte('created_at', todayStart.toISOString()).eq('direction', 'in'),
    supabase.from('appointments').select('*, patient:patients(name, phone)').eq('user_id', userId)
      .order('datetime', { ascending: false }).limit(10),
    supabase.from('appointments').select('datetime, status').eq('user_id', userId)
      .gte('datetime', thirtyDaysAgo.toISOString()),
  ])

  // Calcular taxa de conversão (confirmados+concluídos / total dos últimos 30 dias)
  const total30 = last30days?.length ?? 0
  const converted = last30days?.filter((a) => ['confirmed', 'completed'].includes(a.status as string)).length ?? 0
  const conversionRate = total30 > 0 ? Math.round((converted / total30) * 100) : 0

  // Gráfico: agendamentos por dia nos últimos 7 dias
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    const count = (last30days ?? []).filter((a) => (a.datetime as string).startsWith(dateStr)).length
    return { day: d.toLocaleDateString('pt-BR', { weekday: 'short' }), count }
  })

  return {
    totalPatients: totalPatients ?? 0,
    todayAppointments: todayAppointments ?? [],
    todayMessages: todayMessages ?? 0,
    conversionRate,
    recentAppointments: recentAppointments ?? [],
    chartData,
  }
}

const statusLabels: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Agendado', color: 'bg-blue-500/20 text-blue-300' },
  confirmed: { label: 'Confirmado', color: 'bg-emerald-500/20 text-emerald-300' },
  completed: { label: 'Concluído', color: 'bg-gray-500/20 text-gray-300' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-300' },
  pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-300' },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { totalPatients, todayAppointments, todayMessages, conversionRate, recentAppointments, chartData } =
    await getStats(user.id)

  const columns = [
    {
      key: 'patient',
      label: 'Paciente',
      render: (row: Appointment) => (row.patient as { name: string } | null)?.name ?? '—',
    },
    {
      key: 'datetime',
      label: 'Data/Hora',
      render: (row: Appointment) =>
        new Date(row.datetime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Appointment) => {
        const s = statusLabels[row.status] ?? { label: row.status, color: 'bg-white/10 text-white/60' }
        return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color}`}>{s.label}</span>
      },
    },
    { key: 'type', label: 'Tipo' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard title="Total de Pacientes" value={totalPatients} icon={Users} />
        <StatsCard title="Consultas Hoje" value={todayAppointments.length} icon={CalendarCheck} />
        <StatsCard title="Mensagens Hoje" value={todayMessages} icon={MessageSquare} />
        <StatsCard title="Taxa de Conversão" value={`${conversionRate}%`} icon={TrendingUp} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <h2 className="mb-4 text-sm font-medium text-white/70">Agendamentos — últimos 7 dias</h2>
        <AppointmentsChart data={chartData} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-white/70">Agendamentos Recentes</h2>
        <DataTable
          columns={columns}
          rows={recentAppointments}
          emptyMessage="Nenhum agendamento ainda."
        />
      </div>
    </div>
  )
}
