import React from 'react';
import { 
  Store, 
  CreditCard, 
  Bell, 
  ShieldCheck, 
  FileBarChart, 
  LogOut, 
  Trash2,
  ExternalLink,
  Calendar,
  MessageSquare,
  Settings as SettingsIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Settings() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-12"
    >
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Configurações</h1>
        <p className="text-on-surface-variant text-lg">Gerencie sua clínica, integrações e preferências de conta.</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Profile Section */}
        <section className="col-span-12 lg:col-span-8 space-y-8">
          <div className="bg-surface-container p-8 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Store size={22} className="text-primary" />
                <span>Perfil da Clínica</span>
              </h2>
              <button className="text-primary text-sm font-bold hover:underline">Editar Informações</button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Nome Fantasia</label>
                <input className="w-full bg-surface-low border border-white/5 rounded-xl p-4 text-white focus:ring-1 focus:ring-primary" defaultValue="KinesioFlow Performance Hub" />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">CNPJ / Identificação</label>
                <input className="w-full bg-surface-low border border-white/5 rounded-xl p-4 text-white focus:ring-1 focus:ring-primary" defaultValue="12.345.678/0001-99" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Endereço da Unidade</label>
                <input className="w-full bg-surface-low border border-white/5 rounded-xl p-4 text-white focus:ring-1 focus:ring-primary" defaultValue="Av. Paulista, 1000 - Bela Vista, São Paulo - SP" />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">E-mail de Contato</label>
                <input className="w-full bg-surface-low border border-white/5 rounded-xl p-4 text-white focus:ring-1 focus:ring-primary" defaultValue="contato@kinesioflow.com.br" />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Telefone Principal</label>
                <input className="w-full bg-surface-low border border-white/5 rounded-xl p-4 text-white focus:ring-1 focus:ring-primary" defaultValue="(11) 98888-7777" />
              </div>
            </div>
          </div>

          {/* Integrations */}
          <div className="bg-surface-container p-8 rounded-2xl border border-white/5">
            <h2 className="text-xl font-bold flex items-center gap-3 mb-8">
              <SettingsIcon size={22} className="text-primary" />
              <span>Integrações e Conectividade</span>
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-5 rounded-xl bg-surface-high border border-white/5 group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
                    <MessageSquare size={24} fill="currentColor" />
                  </div>
                  <div>
                    <p className="font-bold">WhatsApp Business API</p>
                    <p className="text-xs text-on-surface-variant">Lembretes automáticos e agendamentos via chat.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest">Conectado</span>
                  <button className="text-on-surface-variant hover:text-white transition-colors"><SettingsIcon size={18} /></button>
                </div>
              </div>

              <div className="flex items-center justify-between p-5 rounded-xl bg-surface-high border border-white/5 group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#4285F4]/10 flex items-center justify-center text-[#4285F4]">
                    <Calendar size={24} fill="currentColor" />
                  </div>
                  <div>
                    <p className="font-bold">Google Calendar</p>
                    <p className="text-xs text-on-surface-variant">Sincronize sua agenda em tempo real.</p>
                  </div>
                </div>
                <button className="px-6 py-2.5 rounded-full border border-white/10 text-sm font-bold hover:bg-white hover:text-surface transition-all">Conectar</button>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar Sections */}
        <aside className="col-span-12 lg:col-span-4 space-y-8">
          {/* Subscription */}
          <div className="bg-surface-container p-8 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 sunset-gradient opacity-10 rounded-full blur-3xl"></div>
            <h2 className="text-xl font-bold mb-8">Assinatura</h2>
            
            <div className="p-5 bg-surface-high rounded-xl mb-8 border border-white/5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-1">Plano Atual</p>
                  <p className="text-2xl font-black text-primary">Performance Pro</p>
                </div>
                <span className="bg-white/10 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest">Anual</span>
              </div>
              <p className="text-xs text-on-surface-variant">Próxima cobrança em 15 de Setembro, 2024</p>
            </div>

            <div className="space-y-4">
              <button className="w-full sunset-gradient py-4 rounded-xl font-bold text-sm text-surface shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all">
                Fazer Upgrade
              </button>
              <button className="w-full py-4 border border-white/10 rounded-xl font-bold text-sm text-on-surface-variant hover:text-white hover:bg-white/5 transition-all">
                Gerenciar Faturamento
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-surface-container p-8 rounded-2xl border border-white/5">
            <h2 className="text-xl font-bold mb-8">Preferências</h2>
            <div className="space-y-6">
              {[
                { label: 'Notificações Push', desc: 'Alertas de novos agendamentos', active: true },
                { label: 'Segurança 2FA', desc: 'Autenticação em duas etapas', active: false },
                { label: 'Relatórios Semanais', desc: 'Evolução dos pacientes via e-mail', active: true },
              ].map((pref, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{pref.label}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{pref.desc}</p>
                  </div>
                  <div className={cn(
                    "w-11 h-6 rounded-full relative cursor-pointer transition-all",
                    pref.active ? "bg-primary" : "bg-surface-highest"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      pref.active ? "right-1" : "left-1"
                    )}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-8 border-t border-white/5">
              <button className="flex items-center gap-2 text-secondary text-xs font-bold hover:opacity-80 transition-opacity uppercase tracking-widest">
                <LogOut size={16} />
                <span>Encerrar todas as sessões</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Danger Zone */}
        <div className="col-span-12 p-8 rounded-2xl border border-secondary/20 bg-secondary/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-secondary">Zona de Exclusão</h3>
              <p className="text-sm text-on-surface-variant mt-1 max-w-xl leading-relaxed">
                Ao excluir sua clínica, todos os dados de pacientes, anamneses e histórico financeiro serão apagados permanentemente. Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
          <button className="px-8 py-4 rounded-xl border border-secondary text-secondary font-bold text-sm hover:bg-secondary hover:text-surface transition-all whitespace-nowrap">
            Excluir Clínica
          </button>
        </div>
      </div>

      <footer className="text-center py-12 border-t border-white/5">
        <p className="text-on-surface-variant text-[10px] uppercase tracking-[0.3em] font-bold">
          © 2024 KinesioFlow Ecosystem. Todos os direitos reservados.
        </p>
      </footer>
    </motion.div>
  );
}
