
import React, { useState, useMemo } from 'react';
import { CycleItem } from '../types';
import DonutChart from './DonutChart';

interface CycleTabProps {
  cycleItems: CycleItem[];
  updateCycleItem: (id: string, updates: Partial<CycleItem>) => void;
  clearCycle: () => void;
}

const CycleTab: React.FC<CycleTabProps> = ({ cycleItems, updateCycleItem, clearCycle }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputCorrect, setInputCorrect] = useState(0);
  const [inputWrong, setInputWrong] = useState(0);
  const [tempUrl, setTempUrl] = useState('');
  const [addMode, setAddMode] = useState(true);
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');

  // Lista de matérias únicas no ciclo para o filtro de DESEMPENHO
  const uniqueSubjects = useMemo(() => {
    const map = new Map();
    cycleItems.forEach(item => {
      if (!map.has(item.subjectId)) {
        map.set(item.subjectId, item.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [cycleItems]);

  // Estatísticas filtradas para o Resumo
  const stats = useMemo(() => {
    // Se "Todas", usamos a lógica de não duplicar stats por frequência (Desempenho Real)
    if (filterSubjectId === 'all') {
      const uniqueIds = Array.from(new Set(cycleItems.map(i => i.subjectId)));
      const uniqueItems = uniqueIds.map(sid => cycleItems.find(i => i.subjectId === sid)).filter(Boolean) as CycleItem[];
      
      const correct = uniqueItems.reduce((acc, item) => acc + item.correct, 0);
      const wrong = uniqueItems.reduce((acc, item) => acc + item.wrong, 0);
      const total = correct + wrong;
      const hStudied = cycleItems.filter(i => i.completed).reduce((acc, i) => acc + (i.hoursPerSession || 0), 0);
      const hToStudy = cycleItems.filter(i => !i.completed).reduce((acc, i) => acc + (i.hoursPerSession || 0), 0);
      
      const correctPct = total > 0 ? Math.round((correct / total) * 100) : 0;
      const wrongPct = total > 0 ? 100 - correctPct : 0;

      return { correct, wrong, total, correctPct, wrongPct, hStudied, hToStudy };
    } 
    
    // Se selecionada uma matéria específica
    const filtered = cycleItems.filter(item => item.subjectId === filterSubjectId);
    // Pegamos o progresso da matéria (que é sincronizado entre as sessões não concluídas)
    // Usamos o primeiro item para pegar os valores de correct/wrong já que são sincronizados
    const baseItem = filtered[0];
    const correct = baseItem?.correct || 0;
    const wrong = baseItem?.wrong || 0;
    const total = correct + wrong;
    
    // Horas específicas daquela matéria no ciclo
    const hStudied = filtered.filter(i => i.completed).reduce((acc, i) => acc + (i.hoursPerSession || 0), 0);
    const hToStudy = filtered.filter(i => !i.completed).reduce((acc, i) => acc + (i.hoursPerSession || 0), 0);

    const correctPct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const wrongPct = total > 0 ? 100 - correctPct : 0;

    return { correct, wrong, total, correctPct, wrongPct, hStudied, hToStudy };
  }, [cycleItems, filterSubjectId]);

  const getPercentStyle = (percent: number) => {
    if (percent < 70) return 'text-red-600 border-red-200 bg-red-50';
    if (percent < 80) return 'text-blue-600 border-blue-200 bg-blue-50';
    return 'text-green-600 border-green-200 bg-green-50';
  };

  const startEdit = (item: CycleItem) => {
    if (item.completed) return;
    setEditingId(item.id);
    setInputCorrect(0); 
    setInputWrong(0);
    setTempUrl(item.notebookUrl || '');
    setAddMode(true);
  };

  const saveEdit = (item: CycleItem) => {
    if (editingId) {
      const finalCorrect = addMode ? item.correct + inputCorrect : inputCorrect;
      const finalWrong = addMode ? item.wrong + inputWrong : inputWrong;

      updateCycleItem(editingId, { 
        correct: finalCorrect, 
        wrong: finalWrong, 
        notebookUrl: tempUrl 
      });
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Seção de Resumo com Filtro de Desempenho */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-2">Análise de Desempenho</h2>
          
          <select 
            value={filterSubjectId}
            onChange={(e) => setFilterSubjectId(e.target.value)}
            className="bg-indigo-50 border-2 border-indigo-100 text-[10px] font-black uppercase tracking-tight py-1.5 px-3 rounded-xl focus:border-indigo-500 outline-none w-full sm:w-56 text-indigo-600"
          >
            <option value="all">Todas as Matérias</option>
            {uniqueSubjects.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-[160px] h-[160px] flex-shrink-0 relative">
            <DonutChart correctPercent={stats.correctPct} wrongPercent={stats.wrongPct} />
          </div>
          
          <div className="flex-grow grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
            <div className="bg-green-50/50 p-3 rounded-xl border border-green-100 flex flex-col items-center">
              <span className="text-xl font-black text-green-600 leading-tight">{stats.correct}</span>
              <span className="text-[9px] font-bold text-green-700/60 uppercase tracking-widest mt-1">Acertos</span>
            </div>
            <div className="bg-red-50/50 p-3 rounded-xl border border-red-100 flex flex-col items-center">
              <span className="text-xl font-black text-red-600 leading-tight">{stats.wrong}</span>
              <span className="text-[9px] font-bold text-red-700/60 uppercase tracking-widest mt-1">Erros</span>
            </div>
            <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex flex-col items-center">
              <span className="text-xl font-black text-indigo-600 leading-tight">{stats.hStudied}h</span>
              <span className="text-[9px] font-bold text-indigo-700/60 uppercase tracking-widest mt-1">Estudadas</span>
            </div>
            <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 flex flex-col items-center">
              <span className="text-xl font-black text-gray-600 leading-tight">{stats.hToStudy}h</span>
              <span className="text-[9px] font-bold text-gray-700/40 uppercase tracking-widest mt-1">A Estudar</span>
            </div>
          </div>
        </div>
      </section>

      {/* Lista do Ciclo (Sempre completa para manter a ordem do estudo) */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-black text-gray-800 mb-5 px-2">Meu Ciclo</h2>

        {cycleItems.length === 0 ? (
          <div className="text-center py-16 text-gray-300 font-medium uppercase tracking-widest text-xs">
            Nenhuma disciplina ativa no ciclo.
          </div>
        ) : (
          <div className="space-y-3">
            {cycleItems.map((item) => {
              const itemTotal = item.correct + item.wrong;
              const itemPercent = itemTotal > 0 ? Math.round((item.correct / itemTotal) * 100) : 0;

              return (
                <div key={item.id} className={`group border rounded-xl overflow-hidden transition-all ${item.completed ? 'bg-gray-50 opacity-70 border-gray-100' : 'hover:border-indigo-200 hover:shadow-md'}`}>
                  <div className={`flex items-center p-4 gap-4 ${item.completed ? 'bg-transparent' : 'bg-white'}`}>
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => {
                        if (editingId === item.id) setEditingId(null);
                        updateCycleItem(item.id, { completed: !item.completed });
                      }}
                      className="w-6 h-6 rounded-full border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                    />

                    <div className="flex-grow min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-3">
                        <h3 className={`font-black text-sm uppercase tracking-tight truncate ${item.completed ? 'text-gray-400' : 'text-gray-900'}`}>
                          {item.name}
                        </h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-[9px] font-black text-gray-400 rounded-md uppercase">{item.hoursPerSession}H</span>
                      </div>
                      
                      {item.notebookUrl ? (
                        <a 
                          href={item.notebookUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded-lg border w-fit ${item.completed ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-indigo-50 text-indigo-500 border-indigo-100 hover:text-indigo-700'}`}
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          CADERNO
                        </a>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-300 uppercase italic">Sem Link</span>
                      )}
                    </div>

                    <div className={`w-16 h-10 flex items-center justify-center rounded-xl border-2 font-black text-sm flex-shrink-0 ${item.completed ? 'bg-white text-gray-300 border-gray-100 opacity-50' : getPercentStyle(itemPercent)}`}>
                      {itemPercent}%
                    </div>

                    <button
                      onClick={() => startEdit(item)}
                      disabled={item.completed}
                      className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${item.completed ? 'text-gray-200 cursor-not-allowed' : 'bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white'}`}
                      title={item.completed ? "Itens estudados não podem ser editados" : "Registrar questões e link"}
                    >
                      {item.completed ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {editingId === item.id && !item.completed && (
                    <div className="bg-indigo-50 p-5 border-t border-indigo-100 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Modo de Registro</label>
                          <div className="flex bg-white rounded-lg p-0.5 border border-indigo-100 overflow-hidden shadow-sm">
                            <button 
                              onClick={() => setAddMode(true)}
                              className={`px-4 py-1.5 text-[9px] font-black rounded-md transition-all ${addMode ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-indigo-600'}`}
                            >
                              SOMAR AO ATUAL
                            </button>
                            <button 
                              onClick={() => setAddMode(false)}
                              className={`px-4 py-1.5 text-[9px] font-black rounded-md transition-all ${!addMode ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-indigo-600'}`}
                            >
                              SUBSTITUIR TUDO
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-indigo-400 uppercase mb-1.5 block">URL do Caderno de Questões</label>
                          <input
                            type="url"
                            value={tempUrl}
                            onChange={e => setTempUrl(e.target.value)}
                            placeholder="Adicione ou altere o link aqui..."
                            className="w-full text-sm px-4 py-2.5 border-2 border-indigo-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-medium bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-sm">
                            <label className="text-[10px] font-black text-green-600 uppercase mb-2 block tracking-widest">
                              {addMode ? 'Acertos a Adicionar' : 'Novo Total de Acertos'}
                            </label>
                            <input
                              type="number"
                              value={inputCorrect}
                              onChange={e => setInputCorrect(Math.max(0, Number(e.target.value)))}
                              className="w-full text-2xl px-4 py-2 border-b-2 border-gray-50 focus:border-green-500 outline-none font-black text-green-700 bg-transparent"
                            />
                            <div className="mt-2 flex justify-between text-[9px] font-bold uppercase tracking-tighter">
                              <span className="text-gray-400">Atual: {item.correct}</span>
                              <span className="text-green-500">Resultado: {addMode ? item.correct + inputCorrect : inputCorrect}</span>
                            </div>
                          </div>

                          <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm">
                            <label className="text-[10px] font-black text-red-600 uppercase mb-2 block tracking-widest">
                              {addMode ? 'Erros a Adicionar' : 'Novo Total de Erros'}
                            </label>
                            <input
                              type="number"
                              value={inputWrong}
                              onChange={e => setInputWrong(Math.max(0, Number(e.target.value)))}
                              className="w-full text-2xl px-4 py-2 border-b-2 border-gray-50 focus:border-red-500 outline-none font-black text-red-700 bg-transparent"
                            />
                            <div className="mt-2 flex justify-between text-[9px] font-bold uppercase tracking-tighter">
                              <span className="text-gray-400">Atual: {item.wrong}</span>
                              <span className="text-red-500">Resultado: {addMode ? item.wrong + inputWrong : inputWrong}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-5 py-2.5 text-xs font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => saveEdit(item)}
                            className="bg-indigo-600 text-white px-10 py-3 rounded-xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-widest"
                          >
                            Confirmar Registro
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default CycleTab;
