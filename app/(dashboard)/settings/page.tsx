'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { CheckCircle, Link2, MessageCircle, CreditCard, AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'

function SettingsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const calendarParam = searchParams.get('calendar')
  const subscriptionParam = searchParams.get('subscription')

  const [profile, setProfile] = useState({ clinic_name: '', phone: '', subscription_status: 'inactive' })
  const [agentSettings, setAgentSettings] = useState({ whatsapp_instance_id: '', google_calendar_id: '', google_tokens: null as string | null })
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingWhatsapp, setSavingWhatsapp] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [whatsappSaved, setWhatsappSaved] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)

  // WhatsApp QR code state
  const [whatsappStatus, setWhatsappStatus] = useState<'open' | 'close' | 'connecting' | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loadingQR, setLoadingQR] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then((r) => r.json()),
      fetch('/api/agent-settings').then((r) => r.json()),
    ]).then(([profileData, agentData]) => {
      if (profileData.profile) {
        setProfile({
          clinic_name: profileData.profile.clinic_name ?? '',
          phone: profileData.profile.phone ?? '',
          subscription_status: profileData.profile.subscription_status ?? 'inactive',
        })
      }
      if (agentData.settings) {
        setAgentSettings({
          whatsapp_instance_id: agentData.settings.whatsapp_instance_id ?? '',
          google_calendar_id: agentData.settings.google_calendar_id ?? '',
          google_tokens: agentData.settings.google_tokens,
        })
        if (agentData.settings.whatsapp_instance_id) {
          checkWhatsappStatus()
        }
      }
      setLoading(false)
    })
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [])

  async function checkWhatsappStatus() {
    const res = await fetch('/api/whatsapp/status')
    const data = await res.json()
    setWhatsappStatus(data.status ?? 'close')
    return data.status as string
  }

  async function connectWhatsapp() {
    setLoadingQR(true)
    setQrCode(null)

    const status = await checkWhatsappStatus()
    if (status === 'open') { setLoadingQR(false); return }

    const res = await fetch('/api/whatsapp/qrcode')
    if (res.ok) {
      const data = await res.json()
      setQrCode(data.qrcode ?? null)
    }
    setLoadingQR(false)

    // Polling a cada 5s para detectar quando escanear
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(async () => {
      const s = await checkWhatsappStatus()
      if (s === 'open') {
        setQrCode(null)
        if (pollingRef.current) clearInterval(pollingRef.current)
      } else {
        // Atualizar QR code a cada 30s (expira)
        const r = await fetch('/api/whatsapp/qrcode')
        if (r.ok) { const d = await r.json(); setQrCode(d.qrcode ?? null) }
      }
    }, 5000)
  }

  async function disconnectWhatsapp() {
    setDisconnecting(true)
    if (pollingRef.current) clearInterval(pollingRef.current)
    await fetch('/api/whatsapp/disconnect', { method: 'POST' })
    setWhatsappStatus('close')
    setQrCode(null)
    setDisconnecting(false)
  }

  async function saveProfile() {
    setSavingProfile(true)
    await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clinic_name: profile.clinic_name, phone: profile.phone }) })
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

  async function handleCheckout() {
    setBillingLoading(true)
    const res = await fetch('/api/billing/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) router.push(data.url)
    else setBillingLoading(false)
  }

  async function handlePortal() {
    setBillingLoading(true)
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) router.push(data.url)
    else setBillingLoading(false)
  }

  const statusBadge = {
    active: { label: 'Ativo', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
    inactive: { label: 'Inativo', color: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' },
    cancelled: { label: 'Cancelado', color: 'bg-red-500/10 text-red-300 border-red-500/30' },
  }[profile.subscription_status] ?? { label: profile.subscription_status, color: 'bg-white/10 text-white/40 border-white/10' }

  if (loading) return <div className="flex h-40 items-center justify-center"><p className="text-sm text-white/40">Carregando...</p></div>

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Configurações</h1>

      {calendarParam === 'connected' && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle className="h-4 w-4" /> Google Calendar conectado com sucesso!
        </div>
      )}
      {subscriptionParam === 'required' && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
          <AlertTriangle className="h-4 w-4" /> É necessário ter uma assinatura ativa para acessar o painel.
        </div>
      )}
      {subscriptionParam === 'success' && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle className="h-4 w-4" /> Assinatura ativada com sucesso!
        </div>
      )}

      {/* Clínica */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-4">
        <p className="text-sm font-semibold text-white">Informações da Clínica</p>
        <div>
          <label className="mb-1 block text-xs text-white/50">Nome da Clínica</label>
          <input value={profile.clinic_name} onChange={(e) => setProfile((p) => ({ ...p, clinic_name: e.target.value }))}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#2F64E0]/50"
            placeholder="Clínica FisioVida" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Telefone</label>
          <input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#2F64E0]/50"
            placeholder="5511999999999" />
        </div>
        <button onClick={saveProfile} disabled={savingProfile}
          className="rounded-md bg-[#2F64E0] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E4FC7] disabled:opacity-50">
          {profileSaved ? 'Salvo!' : savingProfile ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* Google Calendar */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-4">
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
              <input value={agentSettings.google_calendar_id}
                onChange={(e) => setAgentSettings((s) => ({ ...s, google_calendar_id: e.target.value }))}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#2F64E0]/50"
                placeholder="primary" />
              <p className="mt-1 text-xs text-white/30">Use &quot;primary&quot; para o calendário principal</p>
            </div>
            <div className="flex gap-2">
              <button onClick={saveWhatsapp} disabled={savingWhatsapp}
                className="rounded-md bg-[#2F64E0] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E4FC7] disabled:opacity-50">
                {whatsappSaved ? 'Salvo!' : 'Salvar ID'}
              </button>
              <a href="/api/calendar/connect"
                className="flex items-center gap-1.5 rounded-md border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/5">
                <Link2 className="h-4 w-4" /> Reconectar
              </a>
            </div>
          </div>
        ) : (
          <a href="/api/calendar/connect"
            className="inline-flex items-center gap-2 rounded-md bg-white/10 px-4 py-2.5 text-sm text-white hover:bg-white/20">
            <Link2 className="h-4 w-4" /> Conectar Google Calendar
          </a>
        )}
      </div>

      {/* WhatsApp */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-emerald-400" />
            <p className="text-sm font-semibold text-white">WhatsApp</p>
          </div>
          {whatsappStatus === 'open' ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-300">
              <Wifi className="h-3 w-3" /> Conectado
            </span>
          ) : whatsappStatus === 'connecting' ? (
            <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs text-yellow-300">
              <RefreshCw className="h-3 w-3 animate-spin" /> Aguardando scan
            </span>
          ) : whatsappStatus === 'close' ? (
            <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs text-red-300">
              <WifiOff className="h-3 w-3" /> Desconectado
            </span>
          ) : null}
        </div>

        <p className="text-xs text-white/40">
          A instância WhatsApp é criada automaticamente ao conectar.
        </p>

        <div className="flex gap-2">
          {whatsappStatus !== 'open' && (
            <button onClick={connectWhatsapp} disabled={loadingQR}
              className="rounded-md bg-[#2F64E0] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E4FC7] disabled:opacity-50">
              {loadingQR ? 'Carregando QR...' : 'Conectar WhatsApp'}
            </button>
          )}
          {whatsappStatus === 'open' && (
            <div className="flex gap-2">
              <button onClick={checkWhatsappStatus}
                className="rounded-md border border-white/10 px-3 py-2 text-sm text-white/60 hover:bg-white/5">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button onClick={disconnectWhatsapp} disabled={disconnecting}
                className="rounded-md border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50">
                {disconnecting ? 'Desconectando...' : 'Desconectar'}
              </button>
            </div>
          )}
        </div>

        {/* QR Code */}
        {qrCode && whatsappStatus !== 'open' && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50">Escaneie com o WhatsApp do seu celular</p>
            <div className="rounded-lg bg-white p-2">
              {qrCode.startsWith('data:image') ? (
                <Image src={qrCode} alt="QR Code WhatsApp" width={200} height={200} className="rounded" unoptimized />
              ) : (
                <img src={qrCode} alt="QR Code WhatsApp" className="h-48 w-48 rounded" />
              )}
            </div>
            <p className="text-xs text-white/30">O QR code atualiza automaticamente a cada 30s</p>
          </div>
        )}
      </div>

      {/* Assinatura */}
      <div id="billing" className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-[#5B8FF5]" />
          <p className="text-sm font-semibold text-white">Assinatura</p>
          <span className={`rounded-full border px-2.5 py-0.5 text-xs ${statusBadge.color}`}>{statusBadge.label}</span>
        </div>
        {profile.subscription_status === 'active' ? (
          <div className="space-y-3">
            <p className="text-xs text-white/50">Plano FisioGendor — R$ 97/mês</p>
            <button onClick={handlePortal} disabled={billingLoading}
              className="rounded-md border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5 disabled:opacity-50">
              {billingLoading ? 'Aguarde...' : 'Gerenciar assinatura'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-white/50">Acesse todos os recursos por R$ 97/mês</p>
            <button onClick={handleCheckout} disabled={billingLoading}
              className="rounded-md bg-[#2F64E0] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1E4FC7] disabled:opacity-50">
              {billingLoading ? 'Aguarde...' : 'Assinar agora'}
            </button>
          </div>
        )}
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
