
import React, { useState, useMemo } from 'react';
import { CycleItem } from '../types.ts';
import DonutChart from './DonutChart.tsx';

interface CycleTabProps {
  cycleItems: CycleItem[];
  updateCycleItem: (id: string, updates: Partial<CycleItem>) => void;
  clearCycle: () => void;
  deleteCycleItem: (id: string) => void;
}

const CycleTab: React.FC<CycleTabProps> = ({ cycleItems, updateCycleItem, clearCycle, deleteCycleItem }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputCorrect, setInputCorrect] = useState(0);
  const [inputWrong, setInputWrong] = useState(0);
  const [tempUrl, setTempUrl] = useState('');
  const [addMode, setAddMode] = useState(true);
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const uniqueSubjects = useMemo(() => {
    const map = new Map();
    cycleItems.forEach(item => { if (!map.has(item.subjectId)) map.set(item.subjectId, item.name); });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [cycleItems]);

  const stats = useMemo(() => {
    const filtered = filterSubjectId === 'all' ? cycleItems : cycleItems.filter(item => item.subjectId === filterSubjectId);
    if (filtered.length === 0) return { correct: 0, wrong: 0, total: 0, correctPct: 0, wrongPct: 0, hStudied: 0, hToStudy: 0 };

    const hStudied = filtered.filter(i => i.completed).reduce((acc, i) => acc + (i.hoursPerSession || 0), 0);
    const hToStudy = filtered.filter(i => !i.completed).reduce((acc, i) => acc + (i.hoursPerSession || 0), 0);
    
    // Pega o progresso acumulado do item mais recente para a matéria selecionada
    const target = filterSubjectId === 'all' ? null : filtered[0];
    
    let correct = 0;
    let wrong = 0;

    if (filterSubjectId === 'all') {
      const subjectIds = Array.from(new Set(cycleItems.map(i => i.subjectId)));
      subjectIds.forEach(sid => {
        const lastItem = cycleItems.filter(i => i.subjectId === sid).sort((a,b) => b.id.localeCompare(a.id))[0];
        correct += lastItem?.correct || 0;
        wrong += lastItem?.wrong || 0;
      });
    } else {
      const lastItem = filtered.sort((a,b) => b.id.localeCompare(a.id))[0];
      correct = lastItem?.correct || 0;
      wrong = lastItem?.wrong || 0;
    }

    const total = correct + wrong;
    const correctPct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, wrong, total, correctPct, wrongPct: total > 0 ? 100 - correctPct : 0, hStudied, hToStudy };
  }, [cycleItems, filterSubjectId]);

  const saveEdit = (item: CycleItem) => {
    if (editingId) {
      updateCycleItem(editingId, { 
        correct: addMode ? item.correct + inputCorrect : inputCorrect, 
        wrong: addMode ? item.wrong + inputWrong : inputWrong, 
        notebookUrl: tempUrl 
      });
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {showClearConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-red-950/40 backdrop-blur-sm modal-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full modal-zoom-in">
            <h3 className="text-xl font-black text-center text-gray-800 mb-2 uppercase tracking-tight">Limpar Tudo?</h3>
            <p className="text-center text-gray-500 text-sm mb-8">Isso excluirá permanentemente todo o progresso do seu ciclo atual.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { clearCycle(); setShowClearConfirm(false); }} className="w-full bg-red-500 text-white font-black py-4 rounded-2xl uppercase text-xs hover:bg-red-600 transition-colors">Sim, Limpar Ciclo</button>
              <button onClick={() => setShowClearConfirm(false)} className="w-full bg-gray-100 text-gray-500 font-black py-4 rounded-2xl uppercase text-xs hover:bg-gray-200 transition-colors">Manter Estudos</button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Desempenho Geral</h2>
          <select value={filterSubjectId} onChange={(e) => setFilterSubjectId(e.target.value)} className="bg-indigo-50 border-2 border-indigo-100 text-[10px] font-black uppercase py-1.5 px-3 rounded-xl outline-none text-indigo-600 cursor-pointer">
            <option value="all">Todas as Disciplinas</option>
            {uniqueSubjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-[160px] h-[160px] flex-shrink-0 relative">
            <DonutChart correctPercent={stats.correctPct} wrongPercent={stats.wrongPct} />
          </div>
          <div className="flex-grow grid grid-cols-2 lg:grid-cols-4 gap-3 w-full text-center">
            <div className="bg-green-50 p-3 rounded-xl border border-green-100"><span className="text-xl font-black text-green-600 block">{stats.correct}</span><span className="text-[9px] font-bold text-green-700 uppercase">Acertos</span></div>
            <div className="bg-red-50 p-3 rounded-xl border border-red-100"><span className="text-xl font-black text-red-600 block">{stats.wrong}</span><span className="text-[9px] font-bold text-red-700 uppercase">Erros</span></div>
            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100"><span className="text-xl font-black text-indigo-600 block">{stats.hStudied}h</span><span className="text-[9px] font-bold text-indigo-700 uppercase">Realizadas</span></div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100"><span className="text-xl font-black text-gray-600 block">{stats.hToStudy}h</span><span className="text-[9px] font-bold text-gray-700 uppercase">Pendentes</span></div>
          </div>
        </div>
      </section>

      <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-5 px-2">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Meu Ciclo</h2>
          {cycleItems.length > 0 && (
            <button onClick={() => setShowClearConfirm(true)} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest border border-red-100 px-3 py-1.5 rounded-lg transition-all">Limpar Ciclo</button>
          )}
        </div>
        
        {cycleItems.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-bold text-sm uppercase">Nenhum estudo no ciclo atual.</p>
            <p className="text-gray-300 text-[10px] uppercase mt-1">Crie um ciclo na aba de Disciplinas.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cycleItems.map((item) => (
              <div key={item.id} className={`group border-2 rounded-2xl p-4 flex items-center gap-4 transition-all ${item.completed ? 'bg-gray-50 border-transparent opacity-60' : 'bg-white border-gray-50 hover:border-indigo-100 shadow-sm'}`}>
                <input 
                  type="checkbox" 
                  checked={item.completed} 
                  onChange={() => updateCycleItem(item.id, { completed: !item.completed })} 
                  className="w-6 h-6 rounded-full border-2 border-gray-200 text-indigo-600 transition-all cursor-pointer accent-indigo-600" 
                />
                
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-black text-sm uppercase ${item.completed ? 'text-gray-400' : 'text-gray-900'}`}>{item.name}</h3>
                    {item.notebookUrl && (
                      <a href={item.notebookUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">{item.hoursPerSession}h Planejadas</span>
                    {!item.completed && (
                      <span className="text-[8px] bg-indigo-50 text-indigo-400 px-1.5 py-0.5 rounded font-black uppercase">Focar agora</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => { setEditingId(item.id); setInputCorrect(0); setInputWrong(0); setTempUrl(item.notebookUrl); }} 
                    disabled={item.completed} 
                    className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-0"
                    title="Registrar Questões"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button 
                    onClick={() => deleteCycleItem(item.id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    title="Excluir Sessão"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>

                {editingId === item.id && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 backdrop-blur-sm p-4 modal-fade-in">
                    <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl modal-zoom-in">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-lg font-black uppercase tracking-tight">{item.name}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Registrar Novos Resultados</p>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg">
                           <button onClick={() => setAddMode(true)} className={`px-2 py-1 text-[8px] font-black rounded uppercase transition-all ${addMode ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-100'}`}>Somar</button>
                           <button onClick={() => setAddMode(false)} className={`px-2 py-1 text-[8px] font-black rounded uppercase transition-all ${!addMode ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-100'}`}>Definir</button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-green-600 uppercase ml-1">Acertos</label>
                            <input type="number" value={inputCorrect} onChange={e => setInputCorrect(Number(e.target.value))} className="w-full p-3 border-2 border-green-50 rounded-xl outline-none font-black text-green-600 bg-green-50/30 focus:border-green-400" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-red-600 uppercase ml-1">Erros</label>
                            <input type="number" value={inputWrong} onChange={e => setInputWrong(Number(e.target.value))} className="w-full p-3 border-2 border-red-50 rounded-xl outline-none font-black text-red-600 bg-red-50/30 focus:border-red-400" />
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Novo Link do Caderno (Opcional)</label>
                          <input type="url" value={tempUrl} onChange={e => setTempUrl(e.target.value)} placeholder="https://..." className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none font-bold text-sm focus:border-indigo-300" />
                        </div>
                      </div>

                      <div className="flex gap-2 mt-8">
                        <button onClick={() => setEditingId(null)} className="flex-1 py-3 font-bold text-gray-400 hover:bg-gray-50 rounded-xl uppercase text-xs transition-all">Cancelar</button>
                        <button onClick={() => saveEdit(item)} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black uppercase text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Salvar Dados</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CycleTab;
