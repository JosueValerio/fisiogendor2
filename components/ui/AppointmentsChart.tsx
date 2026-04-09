'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartData {
  day: string
  count: number
}

export function AppointmentsChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barSize={20}>
        <XAxis dataKey="day" tick={{ fill: '#ffffff60', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis hide allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: '#1A1919', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
        />
        <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
