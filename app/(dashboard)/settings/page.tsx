'use client'

import { useState, useEffect, Suspense } from 'react'
import { CheckCircle, Link2, MessageCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

function SettingsContent() {
  const searchParams = useSearchParams()
  const calendarParam = searchParams.get('calendar')

  const [profile, setProfile] = useState({ clinic_name: '', phone: '' })
  const [agentSettings, setAgentSettings] = useState({ whatsapp_instance_id: '', google_calendar_id: '', google_tokens: null as string | null })
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingWhatsapp, setSavingWhatsapp] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [whatsappSaved, setWhatsappSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then((r) => r.json()),
      fetch('/api/agent-settings').then((r) => r.json()),
    ]).then(([profileData, agentData]) => {
      if (profileData.profile) {
        setProfile({ clinic_name: profileData.profile.clinic_name ?? '', phone: profileData.profile.phone ?? '' })
      }
      if (agentData.settings) {
        setAgentSettings({
          whatsapp_instance_id: agentData.settings.whatsapp_instance_id ?? '',
          google_calendar_id: agentData.settings.google_calendar_id ?? '',
          google_tokens: agentData.settings.google_tokens,
        })
      }
      setLoading(false)
    })
  }, [])

  async function saveProfile() {
    setSavingProfile(true)
    await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) })
    setSavingProfile(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  async function saveWhatsapp() {
    setSavingWhatsapp(true)
    await fetch('/api/agent-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp_instance_id: agentSettings.whatsapp_instance_id, google_calendar_id: agentSettings.google_calendar_id }),
    })
    setSavingWhatsapp(false)
    setWhatsappSaved(true)
    setTimeout(() => setWhatsappSaved(false), 2000)
  }

  if (loading) return <div className="flex h-40 items-center justify-center"><p className="text-sm text-white/40">Carregando...</p></div>

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Configurações</h1>

      {calendarParam === 'connected' && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle className="h-4 w-4" />
          Google Calendar conectado com sucesso!
        </div>
      )}
      {calendarParam === 'error' && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Erro ao conectar o Google Calendar. Tente novamente.
        </div>
      )}

      {/* Clínica */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <p className="text-sm font-semibold text-white">Informações da Clínica</p>
        <div>
          <label className="mb-1 block text-xs text-white/50">Nome da Clínica</label>
          <input
            value={profile.clinic_name}
            onChange={(e) => setProfile((p) => ({ ...p, clinic_name: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50"
            placeholder="Clínica FisioVida"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Telefone</label>
          <input
            value={profile.phone}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50"
            placeholder="5511999999999"
          />
        </div>
        <button onClick={saveProfile} disabled={savingProfile}
          className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">
          {profileSaved ? 'Salvo!' : savingProfile ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* Google Calendar */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white">Google Calendar</p>
          {agentSettings.google_tokens ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-300">
              <CheckCircle className="h-3 w-3" /> Conectado
            </span>
          ) : (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/40">Desconectado</span>
          )}
        </div>

        {agentSettings.google_tokens ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-white/50">ID do Calendário</label>
              <input
                value={agentSettings.google_calendar_id}
                onChange={(e) => setAgentSettings((s) => ({ ...s, google_calendar_id: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50"
                placeholder="primary"
              />
              <p className="mt-1 text-xs text-white/30">Use &quot;primary&quot; para o calendário principal</p>
            </div>
            <div className="flex gap-2">
              <button onClick={saveWhatsapp} disabled={savingWhatsapp}
                className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">
                {whatsappSaved ? 'Salvo!' : 'Salvar ID'}
              </button>
              <a href="/api/calendar/connect"
                className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/5">
                <Link2 className="h-4 w-4" /> Reconectar
              </a>
            </div>
          </div>
        ) : (
          <a href="/api/calendar/connect"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white hover:bg-white/20">
            <Link2 className="h-4 w-4" /> Conectar Google Calendar
          </a>
        )}
      </div>

      {/* WhatsApp */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-emerald-400" />
          <p className="text-sm font-semibold text-white">WhatsApp (Evolution API)</p>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Nome da Instância</label>
          <input
            value={agentSettings.whatsapp_instance_id}
            onChange={(e) => setAgentSettings((s) => ({ ...s, whatsapp_instance_id: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50"
            placeholder="fisiogendor-instance"
          />
          <p className="mt-1 text-xs text-white/30">Nome da instância configurada na Evolution API</p>
        </div>
        <button onClick={saveWhatsapp} disabled={savingWhatsapp}
          className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">
          {whatsappSaved ? 'Salvo!' : savingWhatsapp ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex h-40 items-center justify-center"><p className="text-sm text-white/40">Carregando...</p></div>}>
      <SettingsContent />
    </Suspense>
  )
}
