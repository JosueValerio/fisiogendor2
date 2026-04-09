'use client'

interface Conversation {
  patient_id: string
  content: string
  direction: string
  created_at: string
  patient: { name: string; phone: string; is_patient?: boolean } | null
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (patientId: string) => void
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  return (
    <div className="flex h-full flex-col gap-0.5 overflow-y-auto p-2">
      {conversations.length === 0 && (
        <p className="p-4 text-center text-sm text-white/40">Nenhuma conversa ainda.</p>
      )}
      {conversations.map((conv) => {
        const isPatient = conv.patient?.is_patient !== false
        return (
          <button
            key={conv.patient_id}
            onClick={() => onSelect(conv.patient_id)}
            className={`flex w-full flex-col gap-0.5 rounded-md px-3 py-2.5 text-left transition-colors ${
              selectedId === conv.patient_id
                ? 'bg-[#2F64E0]/20 border border-[#2F64E0]/30'
                : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-white truncate">
                {conv.patient?.name ?? conv.patient_id}
              </span>
              {!isPatient && (
                <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/40">
                  Contato
                </span>
              )}
            </div>
            <span className="line-clamp-1 text-xs text-white/40">
              {conv.direction === 'out' ? 'Você: ' : ''}{conv.content}
            </span>
            <span className="text-xs text-white/20">
              {new Date(conv.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </button>
        )
      })}
    </div>
  )
}
