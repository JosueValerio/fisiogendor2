import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Smile, 
  PlusCircle, 
  Video, 
  Phone, 
  MoreVertical,
  Zap,
  CheckCircle2,
  History,
  Clock,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { generateAIResponse } from '../services/geminiService';
import { firestore } from '../lib/firebaseUtils';
import { auth } from '../firebase';
import { where, orderBy, limit } from 'firebase/firestore';

interface Patient {
  id: string;
  name: string;
  status: string;
  phone: string;
  ownerUid: string;
}

interface Message {
  id: string | number;
  type: 'sent' | 'received';
  text: string;
  time: string;
}

export default function WhatsApp() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeChat, setActiveChat] = useState<Patient | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: 'received', text: 'Olá Dr. Ricardo, fiz os exercícios de mobilidade de manhã. Senti uma leve pontada no menisco medial, é normal?', time: '14:05' },
    { id: 2, type: 'sent', text: 'Oi Mariana! Sim, é normal no início da fase 2. Continue com o gelo e não force a amplitude acima de 90 graus hoje.', time: '14:15' },
    { id: 3, type: 'received', text: 'Obrigada, Dr. Vejo você na quarta!', time: '14:22' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = firestore.subscribeToCollection<Patient>(
      'patients',
      (data) => {
        setPatients(data);
        if (data.length > 0 && !activeChat) {
          setActiveChat(data[0]);
        }
        setLoading(false);
      },
      where('ownerUid', '==', auth.currentUser.uid)
    );

    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeChat) return;

    const newMessage: Message = {
      id: Date.now(),
      type: 'sent',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    const currentInput = inputText;
    setInputText('');

    // Trigger AI Response
    setIsTyping(true);
    
    const history = messages.map(m => ({
      role: m.type === 'sent' ? 'model' : 'user' as 'user' | 'model',
      text: m.text
    }));

    const aiResponseText = await generateAIResponse(currentInput, history);
    
    setIsTyping(false);
    
    if (aiResponseText) {
      const aiMessage: Message = {
        id: Date.now() + 1,
        type: 'received',
        text: aiResponseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMessage]);

      // Log interaction to Firestore
      await firestore.createDocument('ai_interactions', {
        patientId: activeChat.id,
        patientName: activeChat.name,
        message: currentInput,
        response: aiResponseText,
        type: 'chat',
        summary: aiResponseText.slice(0, 100) + '...',
        timestamp: new Date()
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-120px)] flex bg-surface-low rounded-2xl overflow-hidden border border-white/5"
    >
      {/* Chats List */}
      <section className="w-80 border-r border-white/5 flex flex-col bg-surface">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-bold tracking-tight mb-1">Mensagens</h2>
          <p className="text-xs text-on-surface-variant">{patients.length} conversas ativas</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : patients.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center py-10">Nenhum paciente cadastrado.</p>
          ) : (
            patients.map(chat => (
              <div 
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={cn(
                  "p-4 cursor-pointer transition-all border-l-4",
                  activeChat?.id === chat.id 
                    ? "bg-surface-high border-primary" 
                    : "border-transparent hover:bg-surface-container"
                )}
              >
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-full bg-surface-highest flex items-center justify-center text-primary font-bold border border-white/5">
                    {chat.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className={cn("text-sm font-bold truncate", activeChat?.id === chat.id ? "text-white" : "text-on-surface-variant")}>{chat.name}</h4>
                      <span className={cn("text-[10px] font-bold", activeChat?.id === chat.id ? "text-primary" : "text-on-surface-variant")}>14:22</span>
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">{chat.status}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Chat Window */}
      <section className="flex-1 flex flex-col bg-surface-low relative">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-8 flex items-center justify-between bg-surface/50 backdrop-blur-md border-b border-white/5 z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-surface-highest flex items-center justify-center text-primary font-bold border border-white/5">
                    {activeChat.name.charAt(0)}
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface"></div>
                </div>
                <div>
                  <h3 className="font-bold text-sm">{activeChat.name}</h3>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{activeChat.status}</p>
                </div>
              </div>
              <div className="flex gap-4 text-on-surface-variant">
                <button className="hover:text-primary transition-colors"><Video size={20} /></button>
                <button className="hover:text-primary transition-colors"><Phone size={20} /></button>
                <button className="hover:text-primary transition-colors"><MoreVertical size={20} /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="flex justify-center">
                <span className="text-[10px] bg-surface-highest px-3 py-1 rounded-full text-on-surface-variant uppercase tracking-widest font-bold">Hoje</span>
              </div>

              {messages.map(msg => (
                <div 
                  key={msg.id}
                  className={cn(
                    "flex gap-4 max-w-lg",
                    msg.type === 'sent' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "p-4 rounded-2xl shadow-sm",
                    msg.type === 'sent' 
                      ? "sunset-gradient text-surface rounded-tr-none font-medium" 
                      : "bg-surface-high border border-white/5 rounded-tl-none"
                  )}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <span className={cn(
                      "text-[10px] mt-2 block text-right",
                      msg.type === 'sent' ? "text-surface/70" : "text-on-surface-variant"
                    )}>{msg.time}</span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-4 max-w-lg">
                  <div className="bg-surface-high border border-white/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    <span className="text-xs text-on-surface-variant font-medium">IA está processando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 bg-surface/50 backdrop-blur-md border-t border-white/5 mx-8 mb-8 rounded-2xl">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex items-center gap-4"
              >
                <button type="button" className="text-on-surface-variant hover:text-primary transition-colors"><PlusCircle size={22} /></button>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escreva uma mensagem..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder-on-surface-variant"
                />
                <button type="button" className="text-on-surface-variant hover:text-primary transition-colors"><Smile size={22} /></button>
                <button 
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="w-10 h-10 sunset-gradient flex items-center justify-center rounded-full text-surface shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-on-surface-variant">
            <p>Selecione uma conversa para começar.</p>
          </div>
        )}
      </section>

      {/* Automation Sidebar */}
      <section className="w-80 border-l border-white/5 bg-surface p-6 overflow-y-auto">
        <h2 className="text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-6">Automação & IA</h2>
        
        <div className="bg-surface-high p-5 rounded-2xl mb-8 border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-primary fill-primary" />
              <span className="font-bold text-sm">Status do Bot</span>
            </div>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold">ATIVO</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            O agente de IA está respondendo dúvidas básicas e gerenciando agendamentos.
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
              Gatilhos Ativos
            </h3>
            <div className="space-y-3">
              {['Lembrete 24h antes', 'Pesquisa de NPS Pós-Sessão', 'Dica de Exercício Semanal'].map(trigger => (
                <div key={trigger} className="flex items-center justify-between p-3.5 bg-surface-container rounded-xl group hover:bg-surface-highest transition-colors cursor-pointer border border-transparent hover:border-white/5">
                  <span className="text-xs font-medium text-on-surface-variant group-hover:text-white transition-colors">{trigger}</span>
                  <CheckCircle2 size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
              Histórico de Disparos
            </h3>
            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="w-1 h-10 sunset-gradient rounded-full"></div>
                <div>
                  <p className="text-xs font-bold">Lembrete de Agendamento</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Enviado para Marcos Araújo</p>
                  <div className="flex items-center gap-1 text-[9px] text-on-surface-variant/60 mt-1">
                    <Clock size={10} />
                    <span>Há 15 minutos</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1 h-10 bg-white/10 rounded-full"></div>
                <div>
                  <p className="text-xs font-bold">Dica Terapêutica</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Enviado para Julia Santos</p>
                  <div className="flex items-center gap-1 text-[9px] text-on-surface-variant/60 mt-1">
                    <Clock size={10} />
                    <span>Há 2 horas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button className="w-full mt-10 py-3.5 border border-primary/20 text-primary rounded-xl text-xs font-bold hover:bg-primary/5 transition-all">
          Configurar Fluxos de IA
        </button>
      </section>
    </motion.div>
  );
}
