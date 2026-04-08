import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Settings2, 
  GraduationCap, 
  History, 
  CheckCircle2, 
  HelpCircle,
  AlertCircle,
  Save,
  Plus,
  Edit3,
  Activity,
  Zap,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { firestore } from '../lib/firebaseUtils';
import { auth } from '../firebase';
import { where, limit, orderBy } from 'firebase/firestore';

interface InteractionLog {
  id: string;
  patientName: string;
  type: string;
  summary: string;
  timestamp: any;
  ownerUid: string;
}

export default function AIAgent() {
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = firestore.subscribeToCollection<InteractionLog>(
      'ai_interactions',
      (data) => {
        setLogs(data);
        setLoading(false);
      },
      where('ownerUid', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    return () => unsubscribe();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto"
    >
      <section className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="sunset-gradient p-2 rounded-xl shadow-lg shadow-primary/20">
              <BrainCircuit size={24} className="text-surface" />
            </div>
            <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Cérebro Digital Ativo</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight">Agente KinesioFlow IA</h2>
          <p className="text-on-surface-variant max-w-lg mt-2 leading-relaxed">
            Gerencie a inteligência que automatiza seus agendamentos e responde dúvidas técnicas dos pacientes 24/7.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1 font-bold">Status do Sistema</p>
          <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-sm font-bold text-primary">OPERACIONAL</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-4 bg-surface-container rounded-2xl p-8 relative overflow-hidden group border border-white/5">
          <div className="relative z-10">
            <label className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Taxa de Conversão</label>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter orange-gradient-text">92.4%</span>
              <span className="text-primary text-sm font-bold">+5% este mês</span>
            </div>
            <p className="text-sm text-on-surface-variant mt-2">Agendamentos concluídos sem intervenção humana.</p>
          </div>
        </div>

        <div className="col-span-12 md:col-span-8 bg-surface-container rounded-2xl p-8 border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Volume de Interações</h3>
            <div className="flex gap-4 text-xs font-bold text-on-surface-variant">
              <span className="text-primary cursor-pointer border-b-2 border-primary pb-1">7 Dias</span>
              <span className="cursor-pointer hover:text-white transition-colors">30 Dias</span>
            </div>
          </div>
          <div className="h-32 flex items-end gap-3 w-full">
            {[40, 65, 50, 85, 60, 45, 90].map((h, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 1, delay: i * 0.1 }}
                className="flex-1 sunset-gradient rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-7 space-y-8">
          <div className="bg-surface-container p-8 rounded-2xl border border-white/5 shadow-sm">
            <h3 className="font-bold text-xl mb-8 flex items-center gap-3">
              <Settings2 size={22} className="text-primary" />
              <span>Configurações de Comportamento</span>
            </h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">Tom de Voz</label>
                <select className="w-full bg-surface-low border border-white/5 rounded-xl text-sm p-4 focus:ring-1 focus:ring-primary text-white appearance-none cursor-pointer">
                  <option>Empático e Clínico (Recomendado)</option>
                  <option>Casual e Motivador</option>
                  <option>Formal e Direto</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">Horário de Operação</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-surface-low border border-white/5 px-4 py-3.5 rounded-xl text-sm flex justify-between items-center">
                    <span className="font-medium">24 Horas / 7 Dias</span>
                    <div className="w-10 h-5 bg-primary/20 rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-primary rounded-full shadow-[0_0_8px_rgba(255,159,74,0.5)]"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-2 space-y-3">
                <label className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">Instruções Específicas</label>
                <textarea 
                  className="w-full bg-surface-low border border-white/5 rounded-xl text-sm p-5 focus:ring-1 focus:ring-primary text-white placeholder:text-on-surface-variant/50 resize-none"
                  placeholder="Ex: Sempre pergunte se o paciente sente dor aguda antes de agendar a primeira sessão."
                  rows={4}
                />
              </div>
            </div>
            <button className="mt-8 px-8 py-4 sunset-gradient text-surface rounded-full font-bold text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/10">
              <Save size={18} />
              <span>Salvar Preferências</span>
            </button>
          </div>
          <div className="bg-surface-container p-8 rounded-2xl border border-white/5">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="font-bold text-xl flex items-center gap-3">
                  <GraduationCap size={22} className="text-primary" />
                  <span>Área de Treinamento</span>
                </h3>
              </div>
              <button className="text-primary font-bold text-xs border border-primary/20 px-5 py-2.5 rounded-full hover:bg-primary/5 transition-all flex items-center gap-2">
                <Plus size={16} />
                <span>Adicionar FAQ</span>
              </button>
            </div>
            <div className="space-y-4">
              {[{ title: 'Política de Cancelamento', date: 'Atualizado há 2 dias' }, { title: 'Convênios Aceitos', date: 'Atualizado há 1 semana' }].map((faq, i) => (
                <div key={i} className="bg-surface-high p-5 rounded-xl flex justify-between items-center group cursor-pointer hover:bg-surface-highest transition-all border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-lg text-primary"><HelpCircle size={18} /></div>
                    <div>
                      <p className="text-sm font-bold">{faq.title}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold mt-0.5">{faq.date}</p>
                    </div>
                  </div>
                  <Edit3 size={16} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5 bg-surface-container p-8 rounded-2xl border border-white/5 flex flex-col">
          <h3 className="font-bold text-xl mb-8 flex items-center gap-3"><History size={22} className="text-primary" /><span>Interações Recentes</span></h3>
          <div className="relative flex-1">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/10 to-transparent opacity-30"></div>
            <div className="space-y-10 relative">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : logs.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-10">Nenhuma interação registrada.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex gap-6 items-start">
                    <div className="w-12 h-12 rounded-full sunset-gradient flex items-center justify-center shrink-0 z-10 shadow-lg shadow-primary/30">
                      {log.type === 'Agendamento' ? <CheckCircle2 size={20} className="text-surface" /> : <MessageSquare size={20} className="text-surface" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-sm">{log.type}</h4>
                        <span className="text-[10px] text-on-surface-variant uppercase font-bold">
                          {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recentemente'}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        Paciente <span className="text-white font-bold">{log.patientName}</span>: {log.summary}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <button className="w-full mt-10 py-4 bg-surface-high text-on-surface-variant text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:text-white hover:bg-surface-highest transition-all border border-white/5">Ver Log Completo</button>
        </div>
      </div>
      <div className="fixed bottom-8 right-8 flex items-center gap-6 bg-surface-highest/80 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-2xl z-50">
        <div className="flex items-center gap-3 pr-6 border-r border-white/10">
          <div className="w-10 h-10 rounded-2xl sunset-gradient flex items-center justify-center shadow-lg shadow-primary/20"><Activity size={20} className="text-surface" /></div>
          <div><p className="text-[10px] font-bold text-on-surface-variant leading-none uppercase tracking-widest">Consumo de API</p><p className="text-sm font-black text-primary mt-1">12k / 50k tokens</p></div>
        </div>
        <div className="flex items-center gap-3"><Zap size={18} className="text-primary" /><div><p className="text-[10px] font-bold text-on-surface-variant leading-none uppercase tracking-widest">Latência</p><p className="text-sm font-black text-white mt-1">1.2s</p></div></div>
      </div>
    </motion.div>
  );
}
