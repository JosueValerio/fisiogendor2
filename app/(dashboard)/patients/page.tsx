'use client'

import { useState, useCallback, useEffect } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { SearchInput } from '@/components/ui/SearchInput'
import { AddPatientModal } from '@/components/patients/AddPatientModal'
import { UserPlus } from 'lucide-react'
import type { Patient } from '@/types'

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  async function fetchPatients(search = '') {
    setLoading(true)
    const url = search ? `/api/patients?search=${encodeURIComponent(search)}` : '/api/patients'
    const res = await fetch(url)
    const data = await res.json()
    setPatients(data.patients ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchPatients() }, [])

  const handleSearch = useCallback((value: string) => fetchPatients(value), [])

  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'phone', label: 'Telefone' },
    { key: 'email', label: 'E-mail', render: (p: Patient) => p.email ?? '—' },
    {
      key: 'recovery_progress',
      label: 'Progresso',
      render: (p: Patient) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-orange-500"
              style={{ width: `${p.recovery_progress}%` }}
            />
          </div>
          <span className="text-xs text-white/50">{p.recovery_progress}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (p: Patient) => (
        <span className="inline-flex rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/60">
          {p.status ?? 'Ativo'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Pacientes</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          <UserPlus className="h-4 w-4" />
          Novo Paciente
        </button>
      </div>

      <SearchInput placeholder="Buscar por nome ou telefone..." onSearch={handleSearch} />

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-white/40">Carregando...</p>
        </div>
      ) : (
        <DataTable columns={columns} rows={patients} emptyMessage="Nenhum paciente cadastrado." />
      )}

      <AddPatientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={(p) => setPatients((prev) => [p, ...prev])}
      />
    </div>
  )
}
