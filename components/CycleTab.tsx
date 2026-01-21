
import React, { useState, useMemo } from 'react';
import { CycleItem } from '../types.ts';
import DonutChart from './DonutChart.tsx';

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
    
    const correct = filterSubjectId === 'all' 
      ? Array.from(new Set(filtered.map(f => f.subjectId))).reduce((acc, sid) => acc + (filtered.find(f => f.subjectId === sid)?.correct || 0), 0)
      : filtered[0].correct;
      
    const wrong = filterSubjectId === 'all'
      ? Array.from(new Set(filtered.map(f => f.subjectId))).reduce((acc, sid) => acc + (filtered.find(f => f.subjectId === sid)?.wrong || 0), 0)
      : filtered[0].wrong;

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
      <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Desempenho</h2>
          <select value={filterSubjectId} onChange={(e) => setFilterSubjectId(e.target.value)} className="bg-indigo-50 border-2 border-indigo-100 text-[10px] font-black uppercase py-1.5 px-3 rounded-xl outline-none text-indigo-600">
            <option value="all">Todas</option>
            {uniqueSubjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-[160px] h-[160px] flex-shrink-0 relative"><DonutChart correctPercent={stats.correctPct} wrongPercent={stats.wrongPct} /></div>
          <div className="flex-grow grid grid-cols-2 lg:grid-cols-4 gap-3 w-full text-center">
            <div className="bg-green-50 p-3 rounded-xl border border-green-100"><span className="text-xl font-black text-green-600 block">{stats.correct}</span><span className="text-[9px] font-bold text-green-700 uppercase">Acertos</span></div>
            <div className="bg-red-50 p-3 rounded-xl border border-red-100"><span className="text-xl font-black text-red-600 block">{stats.wrong}</span><span className="text-[9px] font-bold text-red-700 uppercase">Erros</span></div>
            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100"><span className="text-xl font-black text-indigo-600 block">{stats.hStudied}h</span><span className="text-[9px] font-bold text-indigo-700 uppercase">Estudadas</span></div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100"><span className="text-xl font-black text-gray-600 block">{stats.hToStudy}h</span><span className="text-[9px] font-bold text-gray-700 uppercase">A Estudar</span></div>
          </div>
        </div>
      </section>

      <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-black text-gray-800 mb-5 px-2">Meu Ciclo</h2>
        <div className="space-y-3">
          {cycleItems.map((item) => (
            <div key={item.id} className={`border rounded-xl p-4 flex items-center gap-4 ${item.completed ? 'bg-gray-50 opacity-60' : 'bg-white'}`}>
              <input type="checkbox" checked={item.completed} onChange={() => updateCycleItem(item.id, { completed: !item.completed })} className="w-6 h-6 rounded-full border-gray-300 text-indigo-600" />
              <div className="flex-grow">
                <h3 className={`font-black text-sm uppercase ${item.completed ? 'text-gray-400' : 'text-gray-900'}`}>{item.name}</h3>
                <span className="text-[10px] text-gray-400 uppercase font-bold">{item.hoursPerSession}h Planejadas</span>
              </div>
              <button onClick={() => { setEditingId(item.id); setInputCorrect(0); setInputWrong(0); setTempUrl(item.notebookUrl); }} disabled={item.completed} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              {editingId === item.id && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                  <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl">
                    <h3 className="text-lg font-black uppercase mb-4">Registrar Progresso</h3>
                    <input type="number" value={inputCorrect} onChange={e => setInputCorrect(Number(e.target.value))} placeholder="Novos Acertos" className="w-full mb-3 p-3 border rounded-xl outline-none font-bold" />
                    <input type="number" value={inputWrong} onChange={e => setInputWrong(Number(e.target.value))} placeholder="Novos Erros" className="w-full mb-4 p-3 border rounded-xl outline-none font-bold" />
                    <div className="flex gap-2">
                      <button onClick={() => setEditingId(null)} className="flex-1 py-3 font-bold text-gray-400 uppercase text-xs">Cancelar</button>
                      <button onClick={() => saveEdit(item)} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black uppercase text-xs">Salvar</button>
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
