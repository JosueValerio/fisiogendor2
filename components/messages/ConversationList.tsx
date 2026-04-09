'use client'

interface Conversation {
  patient_id: string
  content: string
  direction: string
  created_at: string
  patient: { name: string; phone: string } | null
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (patientId: string) => void
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto p-2">
      {conversations.length === 0 && (
        <p className="p-4 text-center text-sm text-white/40">Nenhuma conversa ainda.</p>
      )}
      {conversations.map((conv) => (
        <button
          key={conv.patient_id}
          onClick={() => onSelect(conv.patient_id)}
          className={`flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
            selectedId === conv.patient_id ? 'bg-orange-500/20 border border-orange-500/30' : 'hover:bg-white/5 border border-transparent'
          }`}
        >
          <span className="text-sm font-medium text-white">
            {conv.patient?.name ?? conv.patient_id}
          </span>
          <span className="line-clamp-1 text-xs text-white/40">
            {conv.direction === 'out' ? 'Você: ' : ''}{conv.content}
          </span>
          <span className="text-xs text-white/20">
            {new Date(conv.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
        </button>
      ))}
    </div>
  )
}
