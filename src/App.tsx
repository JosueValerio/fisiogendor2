import * as React from 'react';
import { useState, useEffect, ErrorInfo, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { auth } from './firebase';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import WhatsApp from './components/WhatsApp';
import Patients from './components/Patients';
import AIAgent from './components/AIAgent';
import Settings from './components/Settings';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LogIn } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'whatsapp': return <WhatsApp />;
      case 'patients': return <Patients />;
      case 'ai-agent': return <AIAgent />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-surface-container p-12 rounded-[2.5rem] border border-white/5 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 sunset-gradient"></div>
          <div className="w-20 h-20 sunset-gradient rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/20">
            <LogIn className="text-surface" size={36} />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-4">Kinesio<span className="orange-gradient-text">Flow</span></h1>
          <p className="text-on-surface-variant mb-10 text-lg leading-relaxed">
            Bem-vindo ao futuro da gestão fisioterapêutica. Entre para acessar sua clínica.
          </p>
          <button 
            onClick={handleLogin}
            className="w-full py-5 bg-white text-black rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-white/90 active:scale-95 transition-all shadow-xl"
          >
            <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
            <span>Entrar com Google</span>
          </button>
          <p className="mt-8 text-xs text-on-surface-variant/50 uppercase tracking-widest font-bold">
            SaaS B2B para Clínicas de Fisioterapia
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-surface flex">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          <TopBar />
          
          <main className="flex-1 p-8 overflow-y-auto">
            {renderView()}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
