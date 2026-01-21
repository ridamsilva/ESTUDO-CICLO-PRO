
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

  // Ordenação: Pendentes primeiro, Concluídas depois.
  const sortedCycleItems = useMemo(() => {
    return [...cycleItems].sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });
  }, [cycleItems]);

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
    
    let correct = 0;
    let wrong = 0;

    if (filterSubjectId === 'all') {
      const subjectIds = Array.from(new Set(cycleItems.map(i => i.subjectId)));
      subjectIds.forEach(sid => {
        const items = cycleItems.filter(i => i.subjectId === sid).sort((a,b) => b.id.localeCompare(a.id));
        correct += items[0]?.correct || 0;
        wrong += items[0]?.wrong || 0;
      });
    } else {
      const items = filtered.sort((a,b) => b.id.localeCompare(a.id));
      correct = items[0]?.correct || 0;
      wrong = items[0]?.wrong || 0;
    }

    const total = correct + wrong;
    const correctPct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, wrong, total, correctPct, wrongPct: total > 0 ? 100 - correctPct : 0, hStudied, hToStudy };
  }, [cycleItems, filterSubjectId]);

  const saveEdit = (item: CycleItem) => {
    if (editingId) {
      updateCycleItem(editingId, { 
        correct: addMode ? (item.correct || 0) + inputCorrect : inputCorrect, 
        wrong: addMode ? (item.wrong || 0) + inputWrong : inputWrong, 
        notebookUrl: tempUrl 
      });
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Confirmação de Reset */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-sm w-full border border-gray-100 modal-zoom-in">
            <h3 className="text-xl font-black text-center text-gray-800 mb-2 uppercase tracking-tight">Reiniciar Ciclo?</h3>
            <p className="text-center text-gray-500 text-sm mb-8 font-medium">Isso removerá todas as sessões do ciclo atual.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { clearCycle(); setShowClearConfirm(false); }} className="w-full bg-red-500 text-white font-black py-4 rounded-2xl uppercase text-xs hover:bg-red-600 transition-colors">Confirmar Limpeza</button>
              <button onClick={() => setShowClearConfirm(false)} className="w-full bg-gray-100 text-gray-500 font-black py-4 rounded-2xl uppercase text-xs hover:bg-gray-200 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho de Performance */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Desempenho</h2>
          <select value={filterSubjectId} onChange={(e) => setFilterSubjectId(e.target.value)} className="bg-indigo-50 border-2 border-indigo-100 text-[10px] font-black uppercase py-1.5 px-3 rounded-xl outline-none text-indigo-600 cursor-pointer">
            <option value="all">Todas as Disciplinas</option>
            {uniqueSubjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-[150px] h-[150px] flex-shrink-0">
            <DonutChart correctPercent={stats.correctPct} wrongPercent={stats.wrongPct} />
          </div>
          <div className="flex-grow grid grid-cols-2 lg:grid-cols-4 gap-3 w-full text-center">
            <div className="bg-green-50 p-3 rounded-xl border border-green-100"><span className="text-lg font-black text-green-600 block">{stats.correct}</span><span className="text-[9px] font-bold text-green-700 uppercase">Acertos</span></div>
            <div className="bg-red-50 p-3 rounded-xl border border-red-100"><span className="text-lg font-black text-red-600 block">{stats.wrong}</span><span className="text-[9px] font-bold text-red-700 uppercase">Erros</span></div>
            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100"><span className="text-lg font-black text-indigo-600 block">{stats.hStudied}h</span><span className="text-[9px] font-bold text-indigo-700 uppercase">Estudado</span></div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100"><span className="text-lg font-black text-gray-600 block">{stats.hToStudy}h</span><span className="text-[9px] font-bold text-gray-700 uppercase">Meta</span></div>
          </div>
        </div>
      </section>

      {/* Lista de Matérias */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-5 px-2">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Meu Ciclo</h2>
          {cycleItems.length > 0 && (
            <button onClick={() => setShowClearConfirm(true)} className="text-[10px] font-black text-red-400 hover:text-red-500 uppercase tracking-widest border border-red-50 px-3 py-1.5 rounded-lg transition-all">Limpar</button>
          )}
        </div>
        
        <div className="space-y-3">
          {sortedCycleItems.map((item) => (
            <div key={item.id} className={`group border-2 rounded-2xl p-5 flex items-center gap-4 transition-all ${item.completed ? 'bg-gray-50 border-transparent opacity-60' : 'bg-white border-gray-100 hover:border-indigo-200 shadow-sm'}`}>
              <input 
                type="checkbox" 
                checked={item.completed} 
                onChange={() => updateCycleItem(item.id, { completed: !item.completed })} 
                className="w-6 h-6 rounded border-2 border-gray-200 text-indigo-600 cursor-pointer accent-indigo-600 transition-all" 
              />
              
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <h3 className={`font-black text-sm uppercase tracking-tight ${item.completed ? 'text-gray-400' : 'text-gray-900'}`}>{item.name}</h3>
                  {item.notebookUrl && item.notebookUrl.trim().length > 0 && (
                    <a href={item.notebookUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700 transition-colors p-1" title="Abrir Caderno">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{item.hoursPerSession}H PLANEJADAS</p>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={() => { setEditingId(item.id); setInputCorrect(0); setInputWrong(0); setTempUrl(item.notebookUrl || ''); }} 
                  disabled={item.completed}
                  className={`p-2.5 rounded-xl transition-all ${item.completed ? 'opacity-0' : 'text-gray-300 hover:text-indigo-600 hover:bg-indigo-50'}`}
                  title="Registrar Resultados"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button onClick={() => deleteCycleItem(item.id)} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>

              {/* MODAL DE REGISTRO - LAYOUT NOON RESTORED */}
              {editingId === item.id && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 modal-fade-in">
                  <div className="bg-white p-8 rounded-[40px] w-full max-w-sm shadow-2xl modal-zoom-in border border-gray-100">
                    <h3 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tight text-center">REGISTRAR PROGRESSO</h3>
                    
                    <div className="space-y-6">
                      {/* Toggle Pill Style */}
                      <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-2">
                        <button onClick={() => setAddMode(true)} className={`flex-1 py-2.5 text-[10px] font-black rounded-xl uppercase transition-all ${addMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>SOMAR</button>
                        <button onClick={() => setAddMode(false)} className={`flex-1 py-2.5 text-[10px] font-black rounded-xl uppercase transition-all ${!addMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>DEFINIR</button>
                      </div>

                      {/* Inputs com Labels Coloridos */}
                      <div className="relative">
                        <label className="absolute -top-3 left-6 px-2 bg-white text-[10px] font-black text-green-500 uppercase tracking-widest z-10">ACERTOS</label>
                        <input 
                          type="number" 
                          value={inputCorrect} 
                          onChange={e => setInputCorrect(Number(e.target.value))} 
                          className="w-full p-6 border-2 border-gray-100 rounded-[24px] outline-none font-black text-xl text-gray-800 focus:border-green-400 transition-all" 
                          placeholder="0" 
                        />
                      </div>
                      
                      <div className="relative">
                        <label className="absolute -top-3 left-6 px-2 bg-white text-[10px] font-black text-red-500 uppercase tracking-widest z-10">ERROS</label>
                        <input 
                          type="number" 
                          value={inputWrong} 
                          onChange={e => setInputWrong(Number(e.target.value))} 
                          className="w-full p-6 border-2 border-gray-100 rounded-[24px] outline-none font-black text-xl text-gray-800 focus:border-red-400 transition-all" 
                          placeholder="0" 
                        />
                      </div>

                      {/* Link Notebook Style */}
                      <div className="pt-2">
                        <input 
                          type="url" 
                          value={tempUrl} 
                          onChange={e => setTempUrl(e.target.value)} 
                          placeholder="Link do Caderno (https://...)" 
                          className="w-full p-4 border-2 border-dashed border-gray-100 rounded-2xl outline-none font-bold text-[11px] text-gray-400 focus:border-indigo-300 text-center bg-gray-50/30" 
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-6 mt-12">
                      <button onClick={() => setEditingId(null)} className="flex-1 py-4 font-black text-gray-400 hover:text-gray-600 uppercase text-[11px] tracking-widest">CANCELAR</button>
                      <button onClick={() => saveEdit(item)} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[11px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">SALVAR</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CycleTab;
