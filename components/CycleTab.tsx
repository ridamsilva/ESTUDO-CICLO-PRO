
import React, { useState, useMemo } from 'react';
import { CycleItem, Subject, HistoryEntry } from '../types.ts';
import DonutChart from './DonutChart.tsx';

interface CycleTabProps {
  subjects: Subject[];
  cycleItems: CycleItem[];
  updateCycleItem: (id: string, updates: Partial<CycleItem>) => void;
  clearCycle: () => void;
  deleteCycleItem: (id: string) => void;
}

const CycleTab: React.FC<CycleTabProps> = ({ subjects, cycleItems, updateCycleItem, clearCycle, deleteCycleItem }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyViewId, setHistoryViewId] = useState<string | null>(null);
  const [inputCorrect, setInputCorrect] = useState<number | ''>(0);
  const [inputWrong, setInputWrong] = useState<number | ''>(0);
  const [tempUrl, setTempUrl] = useState('');
  const [addMode, setAddMode] = useState(true);
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // REGRA DE ORDENAÇÃO: 
  // 1. Sessões PENDENTES sempre no topo.
  // 2. Dentro de cada grupo (Pendentes/Concluídas), as inseridas mais recentemente ficam ACIMA.
  const filteredSortedCycleItems = useMemo(() => {
    let items = [...cycleItems];
    if (filterSubjectId !== 'all') {
      items = items.filter(item => item.subjectId === filterSubjectId);
    }
    
    return items.sort((a, b) => {
      // 1. Sessões pendentes primeiro
      if (!a.completed && b.completed) return -1;
      if (a.completed && !b.completed) return 1;
      
      // 2. Se ambas estão no mesmo status, a inserida mais recentemente (created_at) fica no topo
      // (created_at DESC: b - a)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [cycleItems, filterSubjectId]);

  const uniqueSubjectsInCycle = useMemo(() => {
    const map = new Map();
    cycleItems.forEach(item => { if (!map.has(item.subjectId)) map.set(item.subjectId, item.name); });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [cycleItems]);

  const stats = useMemo(() => {
    const filteredCycleForStats = filterSubjectId === 'all' ? cycleItems : cycleItems.filter(item => item.subjectId === filterSubjectId);
    const hStudied = filteredCycleForStats.filter(i => i.completed).reduce((acc, i) => acc + (i.hoursPerSession || 0), 0);
    const hToStudy = filteredCycleForStats.filter(i => !i.completed).reduce((acc, i) => acc + (i.hoursPerSession || 0), 0);
    
    let correct = 0;
    let wrong = 0;
    if (filterSubjectId === 'all') {
      const activeInCycleIds = new Set(cycleItems.map(i => i.subjectId));
      subjects.forEach(sub => {
        if (activeInCycleIds.has(sub.id)) {
          correct += sub.totalCorrect || 0;
          wrong += sub.totalWrong || 0;
        }
      });
    } else {
      const targetSub = subjects.find(s => s.id === filterSubjectId);
      correct = targetSub?.totalCorrect || 0;
      wrong = targetSub?.totalWrong || 0;
    }

    const total = correct + wrong;
    const correctPct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const wrongPct = total > 0 ? 100 - correctPct : 0;

    return { correct, wrong, total, correctPct, wrongPct, hStudied, hToStudy };
  }, [subjects, cycleItems, filterSubjectId]);

  const saveEdit = (item: CycleItem) => {
    if (editingId) {
      updateCycleItem(editingId, { 
        correct: addMode ? (item.correct || 0) + (Number(inputCorrect) || 0) : (Number(inputCorrect) || 0), 
        wrong: addMode ? (item.wrong || 0) + (Number(inputWrong) || 0) : (Number(inputWrong) || 0), 
        notebookUrl: tempUrl 
      });
      setEditingId(null);
    }
  };

  const getPercentColorClass = (percent: number) => {
    if (percent < 70) return 'bg-red-50 text-red-600 border-red-100';
    if (percent < 80) return 'bg-blue-50 text-blue-600 border-blue-100';
    return 'bg-green-50 text-green-600 border-green-100';
  };

  const currentHistoryItem = useMemo(() => {
    return cycleItems.find(item => item.id === historyViewId);
  }, [cycleItems, historyViewId]);

  const getTypeStyle = (type: HistoryEntry['type']) => {
    switch(type) {
      case 'status': return 'bg-blue-500';
      case 'performance': return 'bg-green-500';
      case 'link': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Modal de Limpeza */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl p-8 max-sm w-full border border-gray-100 modal-zoom-in">
            <h3 className="text-xl font-black text-center text-gray-800 mb-2 uppercase tracking-tight">Limpar Tudo?</h3>
            <p className="text-center text-gray-500 text-sm mb-8 font-medium">As sessões do ciclo serão removidas.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { clearCycle(); setShowClearConfirm(false); }} className="w-full bg-red-500 text-white font-black py-4 rounded-2xl uppercase text-xs">Confirmar Limpeza</button>
              <button onClick={() => setShowClearConfirm(false)} className="w-full bg-gray-100 text-gray-500 font-black py-4 rounded-2xl uppercase text-xs">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Histórico (Auditoria) */}
      {historyViewId && currentHistoryItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 modal-fade-in">
          <div className="bg-white p-8 rounded-[40px] w-full max-w-lg shadow-2xl modal-zoom-in border border-gray-100 max-h-[85vh] flex flex-col">
            <div className="mb-6 flex justify-between items-start border-b border-gray-50 pb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Registro de Auditoria</h3>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">{currentHistoryItem.name}</p>
              </div>
              <button onClick={() => setHistoryViewId(null)} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
              {currentHistoryItem.history && currentHistoryItem.history.length > 0 ? (
                [...(currentHistoryItem.history)].reverse().map((entry, idx) => (
                  <div key={entry.id} className="relative pl-10 group">
                    {/* Linha da Timeline */}
                    {idx !== (currentHistoryItem.history?.length || 0) - 1 && (
                      <div className="absolute left-[15px] top-[30px] bottom-[-24px] w-0.5 bg-gray-100"></div>
                    )}
                    
                    {/* Marcador */}
                    <div className={`absolute left-0 top-1.5 w-8 h-8 rounded-xl ${getTypeStyle(entry.type)} flex items-center justify-center border-4 border-white shadow-sm z-10 group-hover:scale-110 transition-transform`}>
                       <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>

                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 group-hover:bg-white group-hover:shadow-md transition-all">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          {new Date(entry.timestamp).toLocaleString('pt-BR')}
                        </span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded text-white uppercase ${getTypeStyle(entry.type)}`}>
                          {entry.type}
                        </span>
                      </div>
                      <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{entry.action}</p>
                      {entry.details && (
                        <p className="text-[11px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded-lg mt-2 inline-block">
                          {entry.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center flex flex-col items-center">
                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                     <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </div>
                   <p className="text-gray-300 font-black uppercase tracking-widest text-[10px]">Histórico Vazio</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-50">
               <button onClick={() => setHistoryViewId(null)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Fechar Auditoria</button>
            </div>
          </div>
        </div>
      )}

      {/* Painel de Estatísticas */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Desempenho Atual</h2>
          <select value={filterSubjectId} onChange={(e) => setFilterSubjectId(e.target.value)} className="bg-indigo-50 border-2 border-indigo-100 text-[10px] font-black uppercase py-2 px-4 rounded-xl outline-none text-indigo-600 cursor-pointer shadow-sm">
            <option value="all">TODAS AS DISCIPLINAS</option>
            {uniqueSubjectsInCycle.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="w-[140px] h-[140px] flex-shrink-0">
            <DonutChart correctPercent={stats.correctPct} wrongPercent={stats.wrongPct} />
          </div>
          <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100 flex flex-col items-center justify-center shadow-sm">
              <span className="text-2xl font-black text-green-600 leading-none">{stats.correct}</span>
              <span className="text-[9px] font-black text-green-700 uppercase tracking-widest mt-2">Acertos</span>
            </div>
            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 flex flex-col items-center justify-center shadow-sm">
              <span className="text-2xl font-black text-red-600 leading-none">{stats.wrong}</span>
              <span className="text-[9px] font-black text-red-700 uppercase tracking-widest mt-2">Erros</span>
            </div>
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center shadow-sm">
              <span className="text-2xl font-black text-indigo-600 leading-none">{stats.hStudied}h</span>
              <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest mt-2">Estudado</span>
            </div>
            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center shadow-sm">
              <span className="text-2xl font-black text-gray-600 leading-none">{stats.hToStudy}h</span>
              <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest mt-2">Meta</span>
            </div>
          </div>
        </div>
      </section>

      {/* Lista do Ciclo */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-5 px-2">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Meu Ciclo</h2>
            {filterSubjectId !== 'all' && (
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Filtro: {subjects.find(s => s.id === filterSubjectId)?.name}</span>
            )}
          </div>
          {cycleItems.length > 0 && (
            <button onClick={() => setShowClearConfirm(true)} className="text-[10px] font-black text-red-400 hover:text-red-500 uppercase tracking-widest border border-red-50 px-3 py-1.5 rounded-lg transition-all">Limpar</button>
          )}
        </div>
        
        <div className="space-y-3">
          {filteredSortedCycleItems.length > 0 ? filteredSortedCycleItems.map((item) => {
            const currentSub = subjects.find(s => s.id === item.subjectId);
            const corr = item.completed ? (item.correct || 0) : (currentSub?.totalCorrect || 0);
            const wro = item.completed ? (item.wrong || 0) : (currentSub?.totalWrong || 0);
            const totalForPercent = corr + wro;
            const itemPercent = totalForPercent > 0 ? Math.round((corr / totalForPercent) * 100) : 0;

            return (
              <div key={item.id} className={`group border-2 rounded-2xl p-5 flex items-center gap-4 transition-all ${item.completed ? 'bg-indigo-50/30 border-indigo-100 shadow-none opacity-80' : 'bg-white border-gray-100 hover:border-indigo-200 shadow-sm'}`}>
                <input 
                  type="checkbox" 
                  checked={item.completed} 
                  onChange={() => updateCycleItem(item.id, { completed: !item.completed })} 
                  className="w-6 h-6 rounded border-2 border-gray-200 text-indigo-600 cursor-pointer accent-indigo-600 transition-all" 
                />
                
                <div className="flex-grow">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-black text-sm uppercase tracking-tight ${item.completed ? 'text-indigo-900 line-through decoration-indigo-200' : 'text-gray-900'}`}>
                      {item.name}
                    </h3>
                    
                    {(item.notebookUrl || currentSub?.notebookUrl) && (
                      <a href={item.notebookUrl || currentSub?.notebookUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700 transition-colors p-1" title="Abrir Caderno">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}

                    {totalForPercent > 0 && (
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg border ml-1 ${getPercentColorClass(itemPercent)}`}>
                        {itemPercent}%
                      </span>
                    )}

                    {item.completed && item.completed_at && (
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest bg-white/60 px-2 py-0.5 rounded border border-indigo-50 shadow-sm">
                        Concluído em {new Date(item.completed_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{item.hoursPerSession}H PLANEJADAS</p>
                </div>

                <div className="flex items-center gap-1">
                  {/* Botão de Histórico */}
                  <button 
                    onClick={() => setHistoryViewId(item.id)}
                    className="p-2.5 rounded-xl text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    title="Auditoria de Alterações"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>

                  <button 
                    onClick={() => { 
                      setEditingId(item.id); 
                      setInputCorrect(0); 
                      setInputWrong(0); 
                      setTempUrl(item.notebookUrl || currentSub?.notebookUrl || ''); 
                      setAddMode(true);
                    }} 
                    disabled={item.completed}
                    className={`p-2.5 rounded-xl transition-all ${item.completed ? 'opacity-0 pointer-events-none' : 'text-gray-300 hover:text-indigo-600 hover:bg-indigo-50'}`}
                    title="Registrar Resultados"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => deleteCycleItem(item.id)} 
                    className="p-2.5 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Remover"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Modal de Registro de Progresso */}
                {editingId === item.id && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 modal-fade-in">
                    <div className="bg-white p-8 rounded-[40px] w-full max-sm shadow-2xl modal-zoom-in border border-gray-100">
                      <h3 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tight text-center">REGISTRAR PROGRESSO</h3>
                      
                      <div className="space-y-6">
                        <div className="flex bg-gray-100/50 p-1.5 rounded-2xl mb-4">
                          <button onClick={() => setAddMode(true)} className={`flex-1 py-3 text-[10px] font-black rounded-xl uppercase transition-all ${addMode ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>SOMAR</button>
                          <button onClick={() => setAddMode(false)} className={`flex-1 py-3 text-[10px] font-black rounded-xl uppercase transition-all ${!addMode ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>DEFINIR</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative">
                            <label className="absolute -top-3 left-4 px-2 bg-white text-[10px] font-black text-green-500 uppercase tracking-widest z-10">ACERTOS</label>
                            <input 
                              type="number" 
                              value={inputCorrect} 
                              onChange={e => setInputCorrect(e.target.value === '' ? '' : Number(e.target.value))} 
                              className="w-full p-5 border-2 border-gray-100 rounded-[24px] outline-none font-black text-xl text-gray-800 focus:border-green-400 transition-all text-center" 
                              placeholder="0" 
                            />
                          </div>
                          
                          <div className="relative">
                            <label className="absolute -top-3 left-4 px-2 bg-white text-[10px] font-black text-red-500 uppercase tracking-widest z-10">ERROS</label>
                            <input 
                              type="number" 
                              value={inputWrong} 
                              onChange={e => setInputWrong(e.target.value === '' ? '' : Number(e.target.value))} 
                              className="w-full p-5 border-2 border-gray-100 rounded-[24px] outline-none font-black text-xl text-gray-800 focus:border-red-400 transition-all text-center" 
                              placeholder="0" 
                            />
                          </div>
                        </div>

                        <div className="bg-indigo-50/50 rounded-2xl p-6 flex flex-col items-center justify-center border border-dashed border-indigo-200">
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">TOTAL DE QUESTÕES</span>
                          <span className="text-2xl font-black text-indigo-600">
                            {addMode 
                              ? ((currentSub?.totalCorrect || 0) + (currentSub?.totalWrong || 0) + (Number(inputCorrect) || 0) + (Number(inputWrong) || 0))
                              : ((Number(inputCorrect) || 0) + (Number(inputWrong) || 0))
                            } Questões
                          </span>
                        </div>

                        <div className="pt-2">
                          <input 
                            type="url" 
                            value={tempUrl} 
                            onChange={e => setTempUrl(e.target.value)} 
                            placeholder="Link do Caderno de Questões" 
                            className="w-full p-5 border-2 border-gray-100 rounded-2xl outline-none font-bold text-[11px] text-gray-400 focus:border-indigo-200 text-center bg-gray-50/20" 
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-6 mt-10">
                        <button onClick={() => setEditingId(null)} className="flex-1 py-4 font-black text-gray-400 hover:text-gray-600 uppercase text-[11px] tracking-widest">CANCELAR</button>
                        <button onClick={() => saveEdit(item)} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[11px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">SALVAR</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="py-20 text-center">
              <p className="text-gray-300 font-black uppercase tracking-widest text-xs">Ciclo vazio.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CycleTab;
