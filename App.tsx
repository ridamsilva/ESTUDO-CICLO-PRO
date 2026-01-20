
import React, { useState, useEffect } from 'react';
import { Subject, CycleItem, Tab, User } from './types';
import SubjectTab from './components/SubjectTab';
import CycleTab from './components/CycleTab';
import LoginView from './components/LoginView';

const SESSION_KEY = 'estudo_ciclo_current_user_v2';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SUBJECTS);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [cycleItems, setCycleItems] = useState<CycleItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Inicialização da sessão
  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem(SESSION_KEY);
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Erro ao carregar sessão", e);
    }
    setIsLoaded(true);
  }, []);

  // Chaves dinâmicas baseadas no usuário
  const STORAGE_KEY_SUBJECTS = currentUser ? `user_${currentUser.id}_subjects_v2` : '';
  const STORAGE_KEY_CYCLE = currentUser ? `user_${currentUser.id}_cycle_v2` : '';

  // Carregar dados do usuário ao logar
  useEffect(() => {
    if (currentUser && isLoaded && STORAGE_KEY_SUBJECTS) {
      const savedSubjects = localStorage.getItem(STORAGE_KEY_SUBJECTS);
      const savedCycle = localStorage.getItem(STORAGE_KEY_CYCLE);
      
      setSubjects(savedSubjects ? JSON.parse(savedSubjects) : []);
      setCycleItems(savedCycle ? JSON.parse(savedCycle) : []);
    }
  }, [currentUser?.id, isLoaded]);

  // Persistência de dados
  useEffect(() => {
    if (currentUser && isLoaded && STORAGE_KEY_SUBJECTS) {
      localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(subjects));
    }
  }, [subjects, currentUser?.id, isLoaded]);

  useEffect(() => {
    if (currentUser && isLoaded && STORAGE_KEY_CYCLE) {
      localStorage.setItem(STORAGE_KEY_CYCLE, JSON.stringify(cycleItems));
    }
  }, [cycleItems, currentUser?.id, isLoaded]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setSubjects([]);
    setCycleItems([]);
    setShowLogoutConfirm(false);
  };

  const addSubject = (subject: Omit<Subject, 'id' | 'totalCorrect' | 'totalWrong'>) => {
    const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    const newSubject: Subject = {
      ...subject,
      id,
      totalCorrect: 0,
      totalWrong: 0
    };
    setSubjects(prev => [...prev, newSubject]);
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const toggleAllSubjects = (active: boolean) => {
    setSubjects(prev => prev.map(s => ({ ...s, isActive: active })));
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const addToCycle = (selectedSubjectIds: string[], keepProgress: boolean) => {
    const subjectGroups: CycleItem[][] = [];
    
    selectedSubjectIds.forEach(id => {
      const sub = subjects.find(s => s.id === id);
      if (sub) {
        const subGroup: CycleItem[] = [];
        for (let i = 0; i < sub.frequency; i++) {
          const itemId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2);
          subGroup.push({
            id: itemId,
            subjectId: sub.id,
            name: sub.name,
            notebookUrl: sub.notebookUrl,
            completed: false,
            correct: keepProgress ? sub.totalCorrect : 0,
            wrong: keepProgress ? sub.totalWrong : 0,
            hoursPerSession: sub.totalHours
          });
        }
        subjectGroups.push(subGroup);
      }
    });

    const interleavedItems: CycleItem[] = [];
    let hasMoreItems = true;
    let roundIndex = 0;

    while (hasMoreItems) {
      hasMoreItems = false;
      for (const group of subjectGroups) {
        if (roundIndex < group.length) {
          interleavedItems.push(group[roundIndex]);
          hasMoreItems = true;
        }
      }
      roundIndex++;
    }

    setCycleItems(prev => [...interleavedItems, ...prev]);
    setActiveTab(Tab.CYCLE);
  };

  const updateCycleItem = (id: string, updates: Partial<CycleItem>) => {
    setCycleItems(prev => {
      const targetItem = prev.find(item => item.id === id);
      if (!targetItem) return prev;

      const updatedItems = prev.map(item => {
        // Se for o próprio item sendo editado
        if (item.id === id) return { ...item, ...updates };
        
        // Sincronizar outros itens da mesma matéria APENAS se não estiverem concluídos
        if (
          item.subjectId === targetItem.subjectId && 
          !item.completed && // REGRA: Não atualiza registros marcados
          (updates.correct !== undefined || updates.wrong !== undefined || updates.notebookUrl !== undefined)
        ) {
          return { ...item, ...updates };
        }
        return item;
      });

      // Atualiza a matéria base para que novos ciclos venham com o progresso mais recente
      if (updates.correct !== undefined || updates.wrong !== undefined || updates.notebookUrl !== undefined) {
        setSubjects(sPrev => sPrev.map(s => {
          if (s.id === targetItem.subjectId) {
            return {
              ...s,
              totalCorrect: updates.correct ?? s.totalCorrect,
              totalWrong: updates.wrong ?? s.totalWrong,
              notebookUrl: updates.notebookUrl ?? s.notebookUrl
            };
          }
          return s;
        }));
      }
      
      return updatedItems;
    });
  };

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-950/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-center text-gray-800 mb-2 uppercase tracking-tight">Deseja Sair?</h3>
            <p className="text-center text-gray-500 text-sm mb-8 font-medium">
              Sua sessão será encerrada com segurança. Seus dados estão salvos localmente.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-100 hover:bg-red-600 transition-all uppercase text-xs"
              >
                Sim, sair da conta
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full bg-gray-100 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-200 transition-all uppercase text-xs"
              >
                Continuar estudando
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-indigo-600 text-white shadow-md p-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Ciclo Pro
            </h1>
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest opacity-80">
              Olá, {currentUser.username}
            </span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <nav className="flex gap-1 md:gap-2">
              <button
                onClick={() => setActiveTab(Tab.SUBJECTS)}
                className={`px-3 py-1.5 rounded-lg transition-all text-[10px] md:text-xs font-black uppercase ${activeTab === Tab.SUBJECTS ? 'bg-white text-indigo-600' : 'hover:bg-indigo-500 text-white'}`}
              >
                Disciplinas
              </button>
              <button
                onClick={() => setActiveTab(Tab.CYCLE)}
                className={`px-3 py-1.5 rounded-lg transition-all text-[10px] md:text-xs font-black uppercase ${activeTab === Tab.CYCLE ? 'bg-white text-indigo-600' : 'hover:bg-indigo-500 text-white'}`}
              >
                Meu Ciclo
              </button>
            </nav>
            
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-red-500 transition-all group border border-indigo-500/30"
              title="Sair"
            >
              <span className="text-[10px] font-black uppercase hidden sm:block">Sair</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-5xl w-full mx-auto p-4 md:p-6">
        {activeTab === Tab.SUBJECTS ? (
          <SubjectTab 
            subjects={subjects} 
            addSubject={addSubject}
            updateSubject={updateSubject}
            toggleAllSubjects={toggleAllSubjects}
            deleteSubject={deleteSubject}
            addToCycle={addToCycle}
          />
        ) : (
          <CycleTab 
            cycleItems={cycleItems}
            updateCycleItem={updateCycleItem}
            clearCycle={() => {}} 
          />
        )}
      </main>

      <footer className="bg-white border-t p-4 text-center text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
        &copy; {new Date().getFullYear()} Estudo Ciclo Pro - Gerenciamento Individual
      </footer>
    </div>
  );
};

export default App;
