
import React, { useState, useEffect } from 'react';
import { Subject, CycleItem, Tab, User, HistoryEntry } from './types.ts';
import { supabase } from './lib/supabase.ts';
import SubjectTab from './components/SubjectTab.tsx';
import CycleTab from './components/CycleTab.tsx';
import LoginView from './components/LoginView.tsx';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SUBJECTS);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [cycleItems, setCycleItems] = useState<CycleItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, username: session.user.email?.split('@')[0] || 'Usuário' });
      }
      setIsLoaded(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, username: session.user.email?.split('@')[0] || 'Usuário' });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser?.id]);

  const fetchUserData = async () => {
    if (!currentUser) return;
    setIsLoadingData(true);
    try {
      // REGRA: Disciplinas novas inseridas no final (Ordenação ASC por data de criação)
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true });
      
      const { data: cycleData } = await supabase
        .from('cycle_items')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true });

      if (subjectsData) setSubjects(subjectsData || []);
      if (cycleData) setCycleItems(cycleData || []);
    } catch (e) {
      console.error("Erro ao carregar dados", e);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSubjects([]);
    setCycleItems([]);
    setShowLogoutConfirm(false);
  };

  const addSubject = async (subject: Omit<Subject, 'id' | 'totalCorrect' | 'totalWrong' | 'created_at'>) => {
    if (!currentUser) return;
    const { data } = await supabase.from('subjects').insert([{
      ...subject,
      user_id: currentUser.id,
      totalCorrect: 0,
      totalWrong: 0,
      created_at: new Date().toISOString()
    }]).select();

    // REGRA: Adiciona ao final da lista local
    if (data) setSubjects(prev => [...prev, data[0]]);
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    const { error } = await supabase.from('subjects').update(updates).eq('id', id);
    if (!error) {
      setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }
  };

  const toggleAllSubjects = async (active: boolean) => {
    if (!currentUser) return;
    const { error } = await supabase.from('subjects').update({ isActive: active }).eq('user_id', currentUser.id);
    if (!error) {
      setSubjects(prev => prev.map(s => ({ ...s, isActive: active })));
    }
  };

  const deleteSubject = async (id: string) => {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (!error) {
      setSubjects(prev => prev.filter(s => s.id !== id));
    }
  };

  const deleteCycleItem = async (id: string) => {
    const { error } = await supabase.from('cycle_items').delete().eq('id', id);
    if (!error) {
      setCycleItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const clearCycle = async () => {
    if (!currentUser) return;
    const { error } = await supabase.from('cycle_items').delete().eq('user_id', currentUser.id);
    if (!error) {
      setCycleItems([]);
    }
  };

  const addToCycle = async (selectedSubjectIds: string[], keepProgress: boolean) => {
    if (!currentUser || selectedSubjectIds.length === 0) return;

    setIsLoadingData(true);
    try {
      if (!keepProgress) {
        await supabase.from('subjects').update({ totalCorrect: 0, totalWrong: 0 }).in('id', selectedSubjectIds);
        await supabase.from('cycle_items').delete().eq('user_id', currentUser.id);
      }

      const interleaved: any[] = [];
      selectedSubjectIds.forEach((id) => {
        const sub = subjects.find(s => s.id === id);
        if (sub) {
          for (let i = 0; i < (sub.frequency || 1); i++) {
            const baseDate = new Date();
            baseDate.setMilliseconds(baseDate.getMilliseconds() + interleaved.length * 10);
            interleaved.push({
              user_id: currentUser.id,
              subjectId: sub.id,
              name: sub.name,
              notebookUrl: sub.notebookUrl,
              completed: false,
              correct: sub.totalCorrect,
              wrong: sub.totalWrong,
              hoursPerSession: sub.totalHours,
              created_at: baseDate.toISOString(),
              history: [{
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                action: 'Sessão inicializada',
                type: 'system'
              }]
            });
          }
        }
      });

      // Ordenação para inserção consistente
      const finalItems = interleaved.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const { error } = await supabase.from('cycle_items').insert(finalItems);
      
      if (error && error.code === 'PGRST204') {
        const fallbackItems = finalItems.map(({completed_at, history, ...rest}) => rest);
        await supabase.from('cycle_items').insert(fallbackItems);
      } else if (error) {
        throw error;
      }
      
      await fetchUserData();
      setActiveTab(Tab.CYCLE);
    } catch (e) {
      console.error("Erro ao adicionar ao ciclo:", e);
    } finally {
      setIsLoadingData(false);
    }
  };

  const updateCycleItem = async (id: string, updates: Partial<CycleItem>) => {
    if (!currentUser) return;
    const targetItem = cycleItems.find(item => item.id === id);
    if (!targetItem) return;

    let finalUpdates = { ...updates };
    const newHistory: HistoryEntry[] = [];
    const now = new Date().toISOString();

    if (updates.completed !== undefined && updates.completed !== targetItem.completed) {
      newHistory.push({
        id: crypto.randomUUID(),
        timestamp: now,
        action: updates.completed ? 'Sessão concluída' : 'Sessão reaberta',
        type: 'status'
      });
      if (updates.completed) {
        finalUpdates.completed_at = now;
        const sub = subjects.find(s => s.id === targetItem.subjectId);
        finalUpdates.correct = sub?.totalCorrect ?? targetItem.correct;
        finalUpdates.wrong = sub?.totalWrong ?? targetItem.wrong;
      } else {
        finalUpdates.completed_at = null;
      }
    }

    if (updates.correct !== undefined && updates.correct !== targetItem.correct) {
      newHistory.push({
        id: crypto.randomUUID(),
        timestamp: now,
        action: 'Acertos atualizados',
        details: `${targetItem.correct} → ${updates.correct}`,
        type: 'performance'
      });
    }

    if (updates.wrong !== undefined && updates.wrong !== targetItem.wrong) {
      newHistory.push({
        id: crypto.randomUUID(),
        timestamp: now,
        action: 'Erros atualizados',
        details: `${targetItem.wrong} → ${updates.wrong}`,
        type: 'performance'
      });
    }

    if (updates.notebookUrl !== undefined && updates.notebookUrl !== targetItem.notebookUrl) {
      newHistory.push({
        id: crypto.randomUUID(),
        timestamp: now,
        action: 'Caderno atualizado',
        type: 'link'
      });
    }

    if (newHistory.length > 0) {
      finalUpdates.history = [...(targetItem.history || []), ...newHistory];
    }

    setCycleItems(prev => prev.map(item => (item.id === id ? { ...item, ...finalUpdates } : item)));

    try {
      const { error } = await supabase.from('cycle_items').update(finalUpdates).eq('id', id);
      if (error && error.code === 'PGRST204') {
        const { completed_at, history, ...safeUpdates } = finalUpdates;
        await supabase.from('cycle_items').update(safeUpdates).eq('id', id);
      }
    } catch (e) { console.error(e); }

    if (updates.correct !== undefined || updates.wrong !== undefined || updates.notebookUrl !== undefined) {
      const subUpdates: any = {};
      if (updates.correct !== undefined) subUpdates.totalCorrect = updates.correct;
      if (updates.wrong !== undefined) subUpdates.totalWrong = updates.wrong;
      if (updates.notebookUrl !== undefined) subUpdates.notebookUrl = updates.notebookUrl;
      
      updateSubject(targetItem.subjectId, subUpdates);
      
      const otherPendingUpdates: any = { ...subUpdates };
      delete otherPendingUpdates.totalCorrect;
      delete otherPendingUpdates.totalWrong;
      otherPendingUpdates.correct = updates.correct;
      otherPendingUpdates.wrong = updates.wrong;

      await supabase.from('cycle_items')
        .update(otherPendingUpdates)
        .eq('subjectId', targetItem.subjectId)
        .eq('completed', false)
        .eq('user_id', currentUser.id);
    }

    fetchUserData();
  };

  if (!isLoaded) return null;

  if (!currentUser) {
    return <LoginView onLogin={() => {}} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {isLoadingData && (
        <div className="fixed inset-0 z-[110] bg-indigo-900/10 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
          <div className="bg-white p-4 rounded-full shadow-lg">
            <svg className="h-6 w-6 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-sm w-full">
            <h3 className="text-xl font-black text-center text-gray-800 mb-2 uppercase tracking-tight">Deseja Sair?</h3>
            <p className="text-center text-gray-500 text-sm mb-8 font-medium">Sua sessão será encerrada com segurança.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleLogout} className="w-full bg-red-500 text-white font-black py-4 rounded-2xl uppercase text-xs">Sair da Nuvem</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full bg-gray-100 text-gray-500 font-black py-4 rounded-2xl uppercase text-xs">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-indigo-600 text-white shadow-md p-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-xl font-black uppercase tracking-tight">Ciclo Pro <span className="text-[10px] bg-indigo-500 px-1.5 rounded-md ml-1">CLOUD</span></h1>
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest opacity-80">Usuário: {currentUser.username}</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <nav className="flex gap-1 md:gap-2">
              <button onClick={() => setActiveTab(Tab.SUBJECTS)} className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase transition-all ${activeTab === Tab.SUBJECTS ? 'bg-white text-indigo-600 shadow-md' : 'text-white hover:bg-indigo-500'}`}>Disciplinas</button>
              <button onClick={() => setActiveTab(Tab.CYCLE)} className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase transition-all ${activeTab === Tab.CYCLE ? 'bg-white text-indigo-600 shadow-md' : 'text-white hover:bg-indigo-500'}`}>Meu Ciclo</button>
            </nav>
            <button onClick={() => setShowLogoutConfirm(true)} className="p-2 rounded-lg bg-indigo-700 hover:bg-red-500 transition-all text-white border border-indigo-400/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-5xl w-full mx-auto p-4 md:p-6">
        {activeTab === Tab.SUBJECTS ? (
          <SubjectTab subjects={subjects} addSubject={addSubject} updateSubject={updateSubject} toggleAllSubjects={toggleAllSubjects} deleteSubject={deleteSubject} addToCycle={addToCycle} />
        ) : (
          <CycleTab 
            subjects={subjects}
            cycleItems={cycleItems} 
            updateCycleItem={updateCycleItem} 
            clearCycle={clearCycle} 
            deleteCycleItem={deleteCycleItem}
          />
        )}
      </main>
      <footer className="bg-white border-t p-4 text-center text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">&copy; {new Date().getFullYear()} Estudo Ciclo Pro</footer>
    </div>
  );
};

export default App;
