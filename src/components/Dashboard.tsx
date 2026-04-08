import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Zap, 
  ChevronRight,
  User,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { firestore } from '../lib/firebaseUtils';
import { auth } from '../firebase';
import { where, limit, orderBy } from 'firebase/firestore';

interface Patient {
  id: string;
  name: string;
  status: string;
  recoveryProgress: number;
  lesion?: string;
  ownerUid: string;
}

const evolutionData = [
  { name: 'Jan', value: 45 },
  { name: 'Fev', value: 52 },
  { name: 'Mar', value: 48 },
  { name: 'Abr', value: 61 },
  { name: 'Mai', value: 78 },
  { name: 'Jun', value: 94.2 },
];

const injuryData = [
  { name: 'Coluna Lombar', value: 65 },
  { name: 'Joelho (LCA)', value: 42 },
  { name: 'Cervicalgia', value: 28 },
];

const heatmapData = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  intensity: Math.random()
}));

export default function Dashboard() {
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    avgRecovery: 0,
    sessionsToday: 14 // Mocked for now as we don't have many appointments yet
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = firestore.subscribeToCollection<Patient>(
      'patients',
      (data) => {
        setRecentPatients(data.slice(0, 3));
        const avg = data.length > 0 
          ? Math.round(data.reduce((acc, p) => acc + p.recoveryProgress, 0) / data.length) 
          : 0;
        setStats(prev => ({
          ...prev,
          totalPatients: data.length,
          avgRecovery: avg
        }));
        setLoading(false);
      },
      where('ownerUid', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    return () => unsubscribe();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight mb-2">Visão Geral</h2>
        <p className="text-on-surface-variant">Bem-vindo de volta. Seus pacientes estão progredindo conforme o planejado.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container rounded-2xl p-6 hover:bg-surface-high transition-colors group">
          <p className="text-xs font-bold text-on-surface-variant tracking-[0.1em] uppercase mb-1">Total de Pacientes</p>
          <h3 className="text-3xl font-bold">{loading ? '...' : stats.totalPatients}</h3>
          <div className="mt-4 flex items-center text-primary font-bold gap-1 text-sm">
            <TrendingUp size={16} />
            <span>Base de dados ativa</span>
          </div>
        </div>

        <div className="bg-surface-container rounded-2xl p-6 hover:bg-surface-high transition-colors group">
          <p className="text-xs font-bold text-on-surface-variant tracking-[0.1em] uppercase mb-1">Agendamentos Hoje</p>
          <h3 className="text-3xl font-bold">14 Sessões</h3>
          <div className="mt-4 flex items-center text-yellow-400 font-bold gap-1 text-sm">
            <Calendar size={16} />
            <span>Próximo em 45 minutos</span>
          </div>
        </div>

        <div className="bg-surface-container rounded-2xl p-6 hover:bg-surface-high transition-colors group">
          <p className="text-xs font-bold text-on-surface-variant tracking-[0.1em] uppercase mb-1">Índice de Recuperação</p>
          <h3 className="text-3xl font-bold">{loading ? '...' : `${stats.avgRecovery}%`}</h3>
          <div className="mt-4 flex items-center text-secondary font-bold gap-1 text-sm">
            <Zap size={16} />
            <span>Média da clínica</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Evolution Chart */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container rounded-2xl p-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h4 className="text-xl font-bold mb-1">Evolução do Quadro</h4>
              <p className="text-sm text-on-surface-variant">Progresso médio de reabilitação neuromuscular</p>
            </div>
            <div className="flex gap-2 bg-surface-low p-1 rounded-lg">
              <button className="px-3 py-1.5 bg-surface-high rounded-md text-xs font-bold text-white shadow-sm">Mês</button>
              <button className="px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:text-white transition-colors">Semana</button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF9F4A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF9F4A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#ADAAAA', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#262626', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#FF9F4A' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#FF9F4A" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Heatmap */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container rounded-2xl p-8">
          <h4 className="text-xl font-bold mb-1">Ocupação da Clínica</h4>
          <p className="text-sm text-on-surface-variant mb-6">Horários de pico por dia</p>
          
          <div className="grid grid-cols-7 gap-2 mb-8">
            {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map(day => (
              <div key={day} className="text-[10px] text-center font-bold text-on-surface-variant uppercase tracking-widest">{day}</div>
            ))}
            {heatmapData.map(item => (
              <div 
                key={item.id} 
                className="aspect-square rounded-md transition-all hover:scale-110 cursor-pointer"
                style={{ 
                  backgroundColor: `rgba(255, 159, 74, ${0.1 + item.intensity * 0.9})`,
                  boxShadow: item.intensity > 0.8 ? '0 0 10px rgba(255, 159, 74, 0.3)' : 'none'
                }}
              />
            ))}
          </div>

          <div className="pt-6 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Recomendação IA</span>
              <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase">Otimizar</span>
            </div>
            <p className="text-sm text-white leading-relaxed">
              Quintas-feiras às 14h possuem alta demanda. Considere abrir vaga extra.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Next Patients */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container rounded-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold">Pacientes Recentes</h4>
            <button className="text-primary text-xs font-bold hover:underline transition-all">Ver Todos</button>
          </div>
          
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : recentPatients.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-10">Nenhum paciente cadastrado.</p>
            ) : (
              recentPatients.map((patient, i) => (
                <div key={patient.id} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-surface-highest flex items-center justify-center text-primary font-bold border border-white/5 group-hover:border-primary/30 transition-all">
                    {patient.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white group-hover:text-primary transition-colors">{patient.name}</p>
                    <p className="text-xs text-on-surface-variant">{patient.lesion || patient.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{patient.recoveryProgress}%</p>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">Progresso</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="w-full mt-8 py-3.5 bg-surface-high rounded-xl text-sm font-bold text-white hover:bg-surface-highest transition-all border border-white/5">
            Gerenciar Clínica
          </button>
        </div>

        {/* Injury Mapping */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container rounded-2xl p-8 flex gap-8">
          <div className="flex-1">
            <h4 className="text-xl font-bold mb-2">Mapeamento de Lesões</h4>
            <p className="text-sm text-on-surface-variant mb-8">Zonas de maior incidência tratadas este mês. Clique em uma região para detalhar protocolos.</p>
            
            <div className="space-y-6">
              {injuryData.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{item.name}</span>
                    <span className="text-primary font-bold">{item.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-low rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                      className="h-full sunset-gradient rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-48 bg-surface-low rounded-2xl flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity">
              <img 
                src="https://picsum.photos/seed/anatomy/300/500" 
                alt="Anatomy" 
                className="w-full h-full object-cover grayscale"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="relative z-10 p-4 bg-surface-highest/50 backdrop-blur-md rounded-full border border-white/10 text-primary animate-pulse">
              <User size={32} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
