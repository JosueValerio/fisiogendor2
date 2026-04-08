'use client'

import { Search, Bell, HelpCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import Image from 'next/image'

export default function TopBar() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [supabase])

  return (
    <header className="sticky top-0 right-0 w-full z-40 flex justify-between items-center px-8 h-20 bg-surface/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center bg-surface-low px-4 py-2.5 rounded-full w-96 border border-white/5 focus-within:border-primary/30 transition-all">
        <Search size={18} className="text-on-surface-variant mr-3" />
        <input
          type="text"
          placeholder="Buscar pacientes, agendamentos..."
          className="bg-transparent border-none focus:ring-0 text-sm w-full text-white placeholder-on-surface-variant outline-none"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:text-white transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border-2 border-surface" />
          </button>
          <button className="text-on-surface-variant hover:text-white transition-colors">
            <HelpCircle size={20} />
          </button>
        </div>

        <div className="h-8 w-[1px] bg-white/10" />

        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="text-right">
            <p className="text-white font-bold text-sm">
              {user?.user_metadata?.full_name ?? 'Carregando...'}
            </p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Perfil Profissional
            </p>
          </div>
          {user?.user_metadata?.avatar_url ? (
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary/50 transition-all">
              <Image
                src={user.user_metadata.avatar_url as string}
                alt="Avatar"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full sunset-gradient flex items-center justify-center text-surface font-bold text-sm border-2 border-primary/20">
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
