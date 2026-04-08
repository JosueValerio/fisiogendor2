import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  Stethoscope,
  CalendarCheck,
  Edit2,
  FileText,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { firestore } from '../lib/firebaseUtils';
import { auth } from '../firebase';
import { where } from 'firebase/firestore';

interface Patient {
  id: string;
  name: string;
  age?: number;
  sport?: string;
  cpf?: string;
  phone: string;
  status: string;
  recoveryProgress: number;
  lesion?: string;
  sessions?: number;
  clinicalHistory?: string;
  createdAt: any;
  ownerUid: string;
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [filter, setFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ 
    name: '', 
    phone: '', 
    status: 'Em Tratamento', 
    age: '', 
    sport: '', 
    lesion: '',
    clinicalHistory: '' 
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = firestore.subscribeToCollection<Patient>(
      'patients',
      (data) => {
        setPatients(data);
        if (data.length > 0 && !selectedPatient) {
          setSelectedPatient(data[0]);
        }
        setLoading(false);
      },
      where('ownerUid', '==', auth.currentUser.uid)
    );

    return () => unsubscribe();
  }, []);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.name || !newPatient.phone) return;

    await firestore.createDocument('patients', {
      ...newPatient,
      age: parseInt(newPatient.age) || 0,
      recoveryProgress: 0,
      sessions: 0,
    });

    setIsAddingPatient(false);
    setNewPatient({ 
      name: '', 
      phone: '', 
      status: 'Em Tratamento', 
      age: '', 
      sport: '', 
      lesion: '',
      clinicalHistory: '' 
    });
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (p.lesion?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesFilter = filter === 'Todos' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-12 gap-8"
    >
      {/* Header */}
      <div className="col-span-12 flex items-end justify-between mb-2">
        <div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">Gestão de Pacientes</span>
          <h2 className="text-4xl font-extrabold tracking-tighter mt-1">Evolução do Quadro</h2>
        </div>
        <button 
          onClick={() => setIsAddingPatient(true)}
          className="sunset-gradient px-8 py-3.5 rounded-full font-bold text-surface shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
        >
          <UserPlus size={20} />
          <span>Novo Paciente</span>
        </button>
      </div>

      {/* Main List */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou lesão..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-container border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            {['Todos', 'Em Tratamento', 'Alta', 'Pendente'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                  filter === f 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-high"
                )}
              >
                {f} {f === 'Todos' ? `(${patients.length})` : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-container rounded-2xl overflow-hidden border border-white/5">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-primary" size={40} />
              <p className="text-on-surface-variant font-medium">Sincronizando dados...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-20 text-center">
              <p className="text-on-surface-variant">Nenhum paciente encontrado.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-high/50 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                  <th className="px-6 py-5">Paciente</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPatients.map(patient => (
                  <tr 
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={cn(
                      "group cursor-pointer transition-all",
                      selectedPatient?.id === patient.id ? "bg-surface-high/80" : "hover:bg-surface-high/30"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface-highest flex items-center justify-center text-primary font-bold text-sm border border-white/5">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className={cn("font-bold transition-colors", selectedPatient?.id === patient.id ? "text-primary" : "text-white")}>
                            {patient.name}
                          </p>
                          <p className="text-[11px] text-on-surface-variant">{patient.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight",
                        patient.status === 'Em Tratamento' ? "bg-primary/10 text-primary" : 
                        patient.status === 'Alta' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                      )}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-surface-highest rounded-full transition-colors text-on-surface-variant">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Details Side Panel */}
      <div className="col-span-12 lg:col-span-4">
        {selectedPatient ? (
          <motion.div 
            key={selectedPatient.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-surface-container rounded-2xl p-8 h-full border border-white/5 flex flex-col"
          >
            <div className="flex items-start justify-between mb-8">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 block">Detalhes do Paciente</span>
                <h3 className="text-2xl font-bold tracking-tight">{selectedPatient.name}</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  {selectedPatient.age ? `${selectedPatient.age} anos` : 'Idade não informada'} • {selectedPatient.sport || 'Sem esporte'}
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-surface-highest flex items-center justify-center text-2xl font-black text-primary border border-white/10 shadow-lg">
                {selectedPatient.name.charAt(0)}
              </div>
            </div>

            {/* Recovery Progress */}
            <div className="mb-10">
              <div className="flex justify-between items-end mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Recuperação Muscular</span>
                <span className="text-2xl font-black text-primary">{selectedPatient.recoveryProgress}%</span>
              </div>
              <div className="h-2 w-full bg-surface-low rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedPatient.recoveryProgress}%` }}
                  transition={{ duration: 1 }}
                  className="h-full sunset-gradient rounded-full shadow-[0_0_15px_rgba(255,159,74,0.3)]"
                />
              </div>
              <p className="text-[11px] text-on-surface-variant mt-3 italic">
                {selectedPatient.recoveryProgress === 100 ? 'Paciente recebeu alta clínica.' : 'Evoluindo conforme o plano de tratamento.'}
              </p>
            </div>

            {/* Clinical History */}
            <div className="flex-1 space-y-8">
              <div>
                <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Histórico Clínico</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-high p-4 rounded-xl border border-white/5">
                    <Stethoscope size={18} className="text-primary mb-2" />
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Lesão</p>
                    <p className="text-sm font-bold mt-1 leading-tight">{selectedPatient.lesion || 'Não informada'}</p>
                  </div>
                  <div className="bg-surface-high p-4 rounded-xl border border-white/5">
                    <CalendarCheck size={18} className="text-primary mb-2" />
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Sessões</p>
                    <p className="text-sm font-bold mt-1">{selectedPatient.sessions || 0} realizadas</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Observações</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-low p-4 rounded-xl border border-white/5">
                  {selectedPatient.clinicalHistory || 'Nenhuma observação adicional.'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-8 border-t border-white/5 flex gap-3">
              <button className="flex-1 bg-surface-high py-4 rounded-xl text-sm font-bold hover:bg-surface-highest transition-all border border-white/5 flex items-center justify-center gap-2">
                <FileText size={16} />
                <span>Prontuário Completo</span>
              </button>
              <button className="w-14 h-14 flex items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all">
                <Edit2 size={20} />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="bg-surface-container rounded-2xl p-8 h-full border border-white/5 flex items-center justify-center text-center">
            <p className="text-on-surface-variant text-sm">Selecione um paciente para ver os detalhes.</p>
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      <AnimatePresence>
        {isAddingPatient && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-container p-8 rounded-[2.5rem] border border-white/10 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black tracking-tight">Novo Paciente</h3>
                <button onClick={() => setIsAddingPatient(false)} className="p-2 hover:bg-surface-highest rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddPatient} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                    className="w-full bg-surface-low border border-white/5 rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">WhatsApp</label>
                    <input 
                      required
                      type="text" 
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                      className="w-full bg-surface-low border border-white/5 rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Idade</label>
                    <input 
                      type="number" 
                      value={newPatient.age}
                      onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
                      className="w-full bg-surface-low border border-white/5 rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                      placeholder="Ex: 30"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Esporte / Atividade</label>
                  <input 
                    type="text" 
                    value={newPatient.sport}
                    onChange={(e) => setNewPatient({...newPatient, sport: e.target.value})}
                    className="w-full bg-surface-low border border-white/5 rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Ex: Crossfit"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Lesão Principal</label>
                  <input 
                    type="text" 
                    value={newPatient.lesion}
                    onChange={(e) => setNewPatient({...newPatient, lesion: e.target.value})}
                    className="w-full bg-surface-low border border-white/5 rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Ex: Hérnia de Disco"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 sunset-gradient text-surface rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 mt-4"
                >
                  Cadastrar Paciente
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
