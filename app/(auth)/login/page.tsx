'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogIn } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError('Falha ao iniciar login com Google. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-container p-12 rounded-[2.5rem] border border-white/5 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 sunset-gradient" />

      <div className="w-20 h-20 sunset-gradient rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/20">
        <LogIn className="text-surface" size={36} />
      </div>

      <h1 className="text-4xl font-black tracking-tight mb-4">
        Fisio<span className="orange-gradient-text">Gendor</span>
      </h1>

      <p className="text-on-surface-variant mb-10 text-lg leading-relaxed">
        Preencha sua agenda automaticamente via WhatsApp. Entre para acessar sua clínica.
      </p>

      {error && (
        <p className="mb-6 text-sm text-red-400 bg-red-400/10 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full py-5 bg-white text-black rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-white/90 active:scale-95 transition-all shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
        ) : (
          <Image src="https://www.google.com/favicon.ico" width={24} height={24} alt="Google" />
        )}
        <span>{loading ? 'Redirecionando...' : 'Entrar com Google'}</span>
      </button>

      <p className="mt-8 text-xs text-on-surface-variant/50 uppercase tracking-widest font-bold">
        SaaS para Fisioterapeutas
      </p>
    </div>
  )
}
