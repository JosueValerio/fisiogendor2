'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import type { Patient } from '@/types'

interface AddPatientModalProps {
  isOpen: boolean
  onClose: () => void
  onAdded: (patient: Patient) => void
}

export function AddPatientModal({ isOpen, onClose, onAdded }: AddPatientModalProps) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', clinical_history: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nome é obrigatório'
    if (!form.phone.trim()) e.phone = 'Telefone é obrigatório'
    else if (!/^\+?[\d\s\-()]{8,}$/.test(form.phone)) e.phone = 'Telefone inválido'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.field) setErrors({ [data.field]: data.error })
        else setErrors({ _global: data.error ?? 'Erro ao criar paciente' })
        return
      }
      onAdded(data.patient)
      setForm({ name: '', phone: '', email: '', clinical_history: '' })
      setErrors({})
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Paciente">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errors._global && <p className="text-sm text-red-400">{errors._global}</p>}

        <div>
          <label className="mb-1 block text-xs text-white/50">Nome *</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#2F64E0]/50"
            placeholder="Nome completo"
          />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs text-white/50">Telefone * (WhatsApp)</label>
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#2F64E0]/50"
            placeholder="5511999999999"
          />
          {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs text-white/50">E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#2F64E0]/50"
            placeholder="paciente@email.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-white/50">Histórico Clínico</label>
          <textarea
            value={form.clinical_history}
            onChange={(e) => setForm((f) => ({ ...f, clinical_history: e.target.value }))}
            rows={3}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#2F64E0]/50 resize-none"
            placeholder="Diagnóstico, histórico relevante..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-[#2F64E0] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E4FC7] disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Adicionar Paciente'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
