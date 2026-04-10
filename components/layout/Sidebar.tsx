'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MessageSquare, Users, BrainCircuit, Settings, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/messages', label: 'WhatsApp', icon: MessageSquare },
  { href: '/patients', label: 'Pacientes', icon: Users },
  { href: '/ai-agent', label: 'Agente IA', icon: BrainCircuit },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-white/5 bg-surface flex flex-col z-50">
      <div className="p-8">
        <h1 className="text-xl font-bold tracking-tighter text-primary">FisioGendor</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mt-1">
          Agendamento Automático
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200',
                isActive
                  ? 'bg-surface-container text-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-white'
              )}
            >
              <Icon
                size={20}
                className={cn(isActive ? 'text-primary' : 'text-on-surface-variant')}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-6">
        <button className="sunset-gradient w-full py-4 rounded-md font-bold text-surface flex items-center justify-center gap-2 shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all">
          <PlusCircle size={18} />
          <span>Novo Agendamento</span>
        </button>
      </div>
    </aside>
  )
}
