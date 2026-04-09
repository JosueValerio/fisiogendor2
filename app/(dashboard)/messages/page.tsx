'use client'

import { useState, useEffect } from 'react'
import { ConversationList } from '@/components/messages/ConversationList'
import { MessageThread } from '@/components/messages/MessageThread'

interface Conversation {
  patient_id: string
  content: string
  direction: string
  created_at: string
  patient: { name: string; phone: string; is_patient?: boolean } | null
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/messages')
      .then((r) => r.json())
      .then((d) => {
        setConversations(d.conversations ?? [])
        if (d.conversations?.length > 0) setSelectedId(d.conversations[0].patient_id)
      })
  }, [])

  const selectedConversation = conversations.find((c) => c.patient_id === selectedId)

  function handlePromoted(patientId: string, name: string) {
    setConversations((prev) =>
      prev.map((c) =>
        c.patient_id === patientId
          ? { ...c, patient: { ...c.patient!, name, is_patient: true } }
          : c
      )
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">WhatsApp</h1>

      <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-lg border border-white/10 bg-white/5">
        <div className="w-72 flex-shrink-0 border-r border-white/10">
          <div className="border-b border-white/10 p-3">
            <p className="text-sm font-medium text-white/60">Conversas</p>
          </div>
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        <div className="flex-1 min-w-0">
          {selectedId && selectedConversation ? (
            <MessageThread
              patientId={selectedId}
              patientName={selectedConversation.patient?.name ?? selectedId}
              isPatient={selectedConversation.patient?.is_patient !== false}
              patientPhone={selectedConversation.patient?.phone ?? ''}
              onPromoted={handlePromoted}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-white/30">Selecione uma conversa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
