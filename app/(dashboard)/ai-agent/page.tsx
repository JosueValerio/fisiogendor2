'use client'

import { useState, useEffect } from 'react'
import { Bot, X } from 'lucide-react'
import type { AgentSettings, AITone } from '@/types'

const DAYS = [
  { key: 'monday', label: 'Segunda' },
  { key: 'tuesday', label: 'Terça' },
  { key: 'wednesday', label: 'Quarta' },
  { key: 'thursday', label: 'Quinta' },
  { key: 'friday', label: 'Sexta' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
]

const defaultHours = { start: '08:00', end: '18:00', enabled: false }

type PartialSettings = Partial<Pick<AgentSettings, 'ai_enabled' | 'ai_tone' | 'operating_hours' | 'trigger_keywords' | 'specific_instructions'>>

export default function AIAgentPage() {
  const [settings, setSettings] = useState<PartialSettings>({
    ai_enabled: true,
    ai_tone: 'empathetic',
    operating_hours: {},
    trigger_keywords: ['agendar', 'consulta', 'marcar', 'horário'],
    specific_instructions: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')

  useEffect(() => {
    fetch('/api/agent-settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings)
        setLoading(false)
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/agent-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  function updateHours(dayKey: string, field: string, value: string | boolean) {
    setSettings((s) => ({
      ...s,
      operating_hours: {
        ...s.operating_hours,
        [dayKey]: { ...(s.operating_hours?.[dayKey] ?? defaultHours), [field]: value },
      },
    }))
  }

  function addKeyword() {
    const kw = newKeyword.trim()
    if (!kw || settings.trigger_keywords?.includes(kw)) { setNewKeyword(''); return }
    setSettings((s) => ({ ...s, trigger_keywords: [...(s.trigger_keywords ?? []), kw] }))
    setNewKeyword('')
  }

  function removeKeyword(kw: string) {
    setSettings((s) => ({ ...s, trigger_keywords: (s.trigger_keywords ?? []).filter((k) => k !== kw) }))
  }

  if (loading) return <div className="flex h-40 items-center justify-center"><p className="text-sm text-white/40">Carregando...</p></div>

  const tones: { value: AITone; label: string; desc: string }[] = [
    { value: 'empathetic', label: 'Empático', desc: 'Caloroso e pessoal' },
    { value: 'casual', label: 'Casual', desc: 'Informal e amigável' },
    { value: 'formal', label: 'Formal', desc: 'Profissional e conciso' },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Agente IA</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-[#2F64E0] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E4FC7] disabled:opacity-50"
        >
          {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* Toggle AI */}
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-3">
          <Bot className="h-5 w-5 text-[#5B8FF5]" />
          <div>
            <p className="text-sm font-medium text-white">Agente Automático</p>
            <p className="text-xs text-white/40">Responde automaticamente às mensagens WhatsApp</p>
          </div>
        </div>
        <button
          onClick={() => setSettings((s) => ({ ...s, ai_enabled: !s.ai_enabled }))}
          className={`relative h-6 w-11 rounded-full transition-colors ${settings.ai_enabled ? 'bg-[#2F64E0]' : 'bg-white/20'}`}
        >
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.ai_enabled ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      {/* Tom de voz */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-3">
        <p className="text-sm font-medium text-white">Tom de Voz</p>
        <div className="grid grid-cols-3 gap-3">
          {tones.map((t) => (
            <button
              key={t.value}
              onClick={() => setSettings((s) => ({ ...s, ai_tone: t.value }))}
              className={`rounded-md border p-3 text-left transition-colors ${settings.ai_tone === t.value ? 'border-[#2F64E0]/60 bg-[#2F64E0]/10' : 'border-white/10 hover:bg-white/5'}`}
            >
              <p className="text-sm font-medium text-white">{t.label}</p>
              <p className="text-xs text-white/40">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Horários */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-3">
        <p className="text-sm font-medium text-white">Horário de Funcionamento</p>
        <div className="space-y-2">
          {DAYS.map(({ key, label }) => {
            const h = settings.operating_hours?.[key] ?? defaultHours
            return (
              <div key={key} className="flex items-center gap-3">
                <button
                  onClick={() => updateHours(key, 'enabled', !h.enabled)}
                  className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${h.enabled ? 'bg-[#2F64E0]' : 'bg-white/20'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${h.enabled ? 'translate-x-4' : ''}`} />
                </button>
                <span className="w-16 text-sm text-white/70">{label}</span>
                <input type="time" value={h.start} onChange={(e) => updateHours(key, 'start', e.target.value)} disabled={!h.enabled}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white disabled:opacity-30 outline-none focus:border-[#2F64E0]/50" />
                <span className="text-white/30">—</span>
                <input type="time" value={h.end} onChange={(e) => updateHours(key, 'end', e.target.value)} disabled={!h.enabled}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white disabled:opacity-30 outline-none focus:border-[#2F64E0]/50" />
              </div>
            )
          })}
        </div>
      </div>

      {/* Keywords */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-3">
        <p className="text-sm font-medium text-white">Palavras-Chave para Ativação</p>
        <div className="flex flex-wrap gap-2">
          {(settings.trigger_keywords ?? []).map((kw) => (
            <span key={kw} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white">
              {kw}
              <button onClick={() => removeKeyword(kw)} className="text-white/40 hover:text-white"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="Nova palavra-chave (Enter para adicionar)"
            className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#2F64E0]/50"
          />
          <button onClick={addKeyword} className="rounded-md bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20">
            Adicionar
          </button>
        </div>
      </div>

      {/* Instruções específicas */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-3">
        <p className="text-sm font-medium text-white">Instruções Específicas</p>
        <textarea
          value={settings.specific_instructions ?? ''}
          onChange={(e) => setSettings((s) => ({ ...s, specific_instructions: e.target.value }))}
          rows={4}
          placeholder="Ex: Sempre perguntar o plano de saúde do paciente. Não agendar para sábados..."
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none resize-none focus:border-[#2F64E0]/50"
        />
      </div>
    </div>
  )
}
