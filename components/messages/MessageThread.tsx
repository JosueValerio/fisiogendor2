'use client'

import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import type { Message } from '@/types'

interface MessageThreadProps {
  patientId: string
  patientName: string
}

export function MessageThread({ patientId, patientName }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/messages?patientId=${patientId}`)
      const data = await res.json()
      if (data.messages) setMessages(data.messages)
    }
    load()
  }, [patientId])

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

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="font-medium text-white">{patientName}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                msg.direction === 'out'
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-sm'
                  : 'bg-white/10 text-white/90 rounded-bl-sm'
              }`}
            >
              <p>{msg.content}</p>
              <p className={`mt-0.5 text-right text-[10px] ${msg.direction === 'out' ? 'text-white/60' : 'text-white/30'}`}>
                {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-white/10 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite uma mensagem..."
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-orange-500/50"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="rounded-xl bg-orange-500 p-2.5 text-white hover:bg-orange-600 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
