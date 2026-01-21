
import React, { useState, useEffect } from 'react';
import { Subject, CycleItem, Tab, User } from './types.ts';
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
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('name');
      
      const { data: cycleData } = await supabase
        .from('cycle_items')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (subjectsData) setSubjects(subjectsData);
      if (cycleData) setCycleItems(cycleData);
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

  const addSubject = async (subject: Omit<Subject, 'id' | 'totalCorrect' | 'totalWrong'>) => {
    if (!currentUser) return;
    const { data } = await supabase.from('subjects').insert([{
      ...subject,
      user_id: currentUser.id,
      totalCorrect: 0,
      totalWrong: 0
    }]).select();

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

  const addToCycle = async (selectedSubjectIds: string[], keepProgress: boolean) => {
    if (!currentUser) return;

    const subjectGroups: any[][] = [];
    selectedSubjectIds.forEach(id => {
      const sub = subjects.find(s => s.id === id);
      if (sub) {
        const group: any[] = [];
        for (let i = 0; i < sub.frequency; i++) {
          group.push({
            user_id: currentUser.id,
            subjectId: sub.id,
            name: sub.name,
            notebookUrl: sub.notebookUrl,
            completed: false,
            correct: keepProgress ? sub.totalCorrect : 0,
            wrong: keepProgress ? sub.totalWrong : 0,
            hoursPerSession: sub.totalHours
          });
        }
        subjectGroups.push(group);
      }
    });

    const interleaved: any[] = [];
    let hasMoreItems = true;
    let roundIndex = 0;

    while (hasMoreItems) {
      hasMoreItems = false;
      for (const group of subjectGroups) {
        if (roundIndex < group.length) {
          const baseDate = new Date();
          baseDate.setSeconds(baseDate.getSeconds() + interleaved.length);
          interleaved.push({
            ...group[roundIndex],
            created_at: baseDate.toISOString()
          });
          hasMoreItems = true;
        }
      }
      roundIndex++;
    }

    if (interleaved.length === 0) return;

    const { data } = await supabase.from('cycle_items').insert(interleaved).select();
    if (data) {
      fetchUserData();
      setActiveTab(Tab.CYCLE);
    }
  };

  const updateCycleItem = async (id: string, updates: Partial<CycleItem>) => {
    if (!currentUser) return;
    const targetItem = cycleItems.find(item => item.id === id);
    if (!targetItem) return;

    await supabase.from('cycle_items').update(updates).eq('id', id);
    
    if (updates.correct !== undefined || updates.wrong !== undefined || updates.notebookUrl !== undefined) {
      const syncUpdates: any = {};
      if (updates.correct !== undefined) syncUpdates.correct = updates.correct;
      if (updates.wrong !== undefined) syncUpdates.wrong = updates.wrong;
      if (updates.notebookUrl !== undefined) syncUpdates.notebookUrl = updates.notebookUrl;

      await supabase.from('cycle_items')
        .update(syncUpdates)
        .eq('subjectId', targetItem.subjectId)
        .eq('completed', false)
        .eq('user_id', currentUser.id);

      await supabase.from('subjects')
        .update({
          totalCorrect: updates.correct ?? targetItem.correct,
          totalWrong: updates.wrong ?? targetItem.wrong,
          notebookUrl: updates.notebookUrl ?? targetItem.notebookUrl
        })
        .eq('id', targetItem.subjectId);
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
        <div className="fixed inset-0 z-[110] bg-indigo-900/10 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white p-4 rounded-full shadow-lg">
            <svg className="h-6 w-6 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full">
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
              <button onClick={() => setActiveTab(Tab.SUBJECTS)} className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase ${activeTab === Tab.SUBJECTS ? 'bg-white text-indigo-600' : 'text-white'}`}>Disciplinas</button>
              <button onClick={() => setActiveTab(Tab.CYCLE)} className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase ${activeTab === Tab.CYCLE ? 'bg-white text-indigo-600' : 'text-white'}`}>Meu Ciclo</button>
            </nav>
            <button onClick={() => setShowLogoutConfirm(true)} className="p-2 rounded-lg bg-indigo-700 hover:bg-red-500 transition-all text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-5xl w-full mx-auto p-4 md:p-6">
        {activeTab === Tab.SUBJECTS ? (
          <SubjectTab subjects={subjects} addSubject={addSubject} updateSubject={updateSubject} toggleAllSubjects={toggleAllSubjects} deleteSubject={deleteSubject} addToCycle={addToCycle} />
        ) : (
          <CycleTab cycleItems={cycleItems} updateCycleItem={updateCycleItem} clearCycle={() => {}} />
        )}
      </main>
      <footer className="bg-white border-t p-4 text-center text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">&copy; {new Date().getFullYear()} Estudo Ciclo Pro - Supabase Cloud Storage</footer>
    </div>
  );
};

export default App;
