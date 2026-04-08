import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FisioGendor — Agendamento Automático via WhatsApp',
  description: 'SaaS de automação de agendamento para fisioterapeutas e clínicas.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
