'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, UserPlus } from 'lucide-react'
import type { Message } from '@/types'

interface MessageThreadProps {
  patientId: string
  patientName: string
  isPatient: boolean
  patientPhone: string
  onPromoted: (patientId: string, name: string) => void
}

export function MessageThread({ patientId, patientName, isPatient, patientPhone, onPromoted }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [promoteMode, setPromoteMode] = useState(false)
  const [promoteName, setPromoteName] = useState('')
  const [promoting, setPromoting] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/messages?patientId=${patientId}`)
      const data = await res.json()
      if (data.messages) setMessages(data.messages)
    }
    load()
    setPromoteName(patientName !== patientPhone ? patientName : '')
  }, [patientId, patientName, patientPhone])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, content: input }),
      })
      if (res.ok) {
        const optimistic: Message = {
          id: crypto.randomUUID(),
          user_id: '',
          patient_id: patientId,
          content: input,
          direction: 'out',
          whatsapp_message_id: null,
          processed: true,
          intent: null,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, optimistic])
        setInput('')
      }
    } finally {
      setSending(false)
    }
  }

  async function handlePromote() {
    if (!promoteName.trim()) return
    setPromoting(true)
    const res = await fetch('/api/whatsapp/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, name: promoteName.trim() }),
    })
    setPromoting(false)
    if (res.ok) {
      setPromoteMode(false)
      onPromoted(patientId, promoteName.trim())
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-medium text-white">{patientName}</p>
          {patientPhone && patientPhone !== patientName && (
            <p className="text-xs text-white/40">{patientPhone}</p>
          )}
        </div>
        {!isPatient && !promoteMode && (
          <button
            onClick={() => setPromoteMode(true)}
            className="flex items-center gap-1.5 rounded-md bg-[#2F64E0]/20 border border-[#2F64E0]/30 px-3 py-1.5 text-xs text-[#5B8FF5] hover:bg-[#2F64E0]/30 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Adicionar como paciente
          </button>
        )}
      </div>

      {/* Banner de promoção */}
      {!isPatient && promoteMode && (
        <div className="border-b border-[#2F64E0]/20 bg-[#2F64E0]/10 px-4 py-3 space-y-2">
          <p className="text-xs font-medium text-[#5B8FF5]">Adicionar como paciente</p>
          <div className="flex gap-2">
            <input
              value={promoteName}
              onChange={(e) => setPromoteName(e.target.value)}
              placeholder="Nome completo do paciente"
              className="flex-1 rounded-md border border-[#2F64E0]/30 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-[#2F64E0]/60"
              autoFocus
            />
            <button
              onClick={handlePromote}
              disabled={promoting || !promoteName.trim()}
              className="rounded-md bg-[#2F64E0] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1E4FC7] disabled:opacity-50"
            >
              {promoting ? 'Salvando...' : 'Confirmar'}
            </button>
            <button
              onClick={() => setPromoteMode(false)}
              className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:bg-white/5"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-xl px-3.5 py-2 text-sm ${
              msg.direction === 'out'
                ? 'bg-gradient-to-br from-[#2F64E0] to-[#1E4FC7] text-white rounded-br-sm'
                : 'bg-white/10 text-white/90 rounded-bl-sm'
            }`}>
              <p>{msg.content}</p>
              <p className={`mt-0.5 text-right text-[10px] ${msg.direction === 'out' ? 'text-white/60' : 'text-white/30'}`}>
                {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-white/10 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite uma mensagem..."
          className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#2F64E0]/50"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="rounded-md bg-[#2F64E0] p-2.5 text-white hover:bg-[#1E4FC7] disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
