
import React, { useState } from 'react';
import { Subject } from '../types.ts';

interface SubjectTabProps {
  subjects: Subject[];
  addSubject: (subject: Omit<Subject, 'id' | 'totalCorrect' | 'totalWrong'>) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  toggleAllSubjects: (active: boolean) => void;
  deleteSubject: (id: string) => void;
  addToCycle: (ids: string[], keepProgress: boolean) => void;
}

const SubjectTab: React.FC<SubjectTabProps> = ({ 
  subjects, addSubject, updateSubject, toggleAllSubjects, deleteSubject, addToCycle 
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [hours, setHours] = useState(1);
  const [freq, setFreq] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editHours, setEditHours] = useState(1);
  const [editFreq, setEditFreq] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addSubject({ name, notebookUrl: url, totalHours: hours, frequency: freq, isActive: true });
    setName(''); setUrl(''); setHours(1); setFreq(1);
  };

  const startEditing = (sub: Subject) => {
    setEditingId(sub.id); setEditName(sub.name); setEditUrl(sub.notebookUrl); setEditHours(sub.totalHours); setEditFreq(sub.frequency);
  };

  const saveEditing = (id: string) => {
    updateSubject(id, { name: editName, notebookUrl: editUrl, totalHours: editHours, frequency: editFreq });
    setEditingId(null);
  };

  const activeSubjectsCount = subjects.filter(s => s.isActive).length;
  const handleToggleAll = () => toggleAllSubjects(activeSubjectsCount !== subjects.length);
  
  const handleGenerateCycle = () => {
    const active = subjects.filter(s => s.isActive);
    if (active.length === 0) return;
    setShowConfirmModal(true);
  };

  return (
    <div className="space-y-6">
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-gray-100 modal-zoom-in">
            <h3 className="text-xl font-black text-center text-gray-800 mb-2 uppercase tracking-tight">O que deseja fazer?</h3>
            <p className="text-center text-gray-500 text-sm mb-8">Deseja adicionar estas novas sessões ao seu ciclo atual ou apagar tudo e começar um novo?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { addToCycle(subjects.filter(s => s.isActive).map(s => s.id), true); setShowConfirmModal(false); }} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase text-xs hover:bg-indigo-700 transition-colors">Manter Tudo e Adicionar</button>
              <button onClick={() => { addToCycle(subjects.filter(s => s.isActive).map(s => s.id), false); setShowConfirmModal(false); }} className="w-full bg-white text-red-500 font-black py-4 rounded-2xl border-2 border-red-50 uppercase text-xs hover:bg-red-50 transition-colors">Apagar e Reiniciar</button>
              <button onClick={() => setShowConfirmModal(false)} className="w-full text-gray-300 font-bold py-2 uppercase text-[10px] hover:text-gray-500">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-black mb-6 text-gray-800 uppercase tracking-tight">Nova Disciplina</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Matéria" className="px-4 py-2.5 border-2 border-gray-100 rounded-xl outline-none focus:border-indigo-300 transition-all" />
          <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Link Caderno" className="px-4 py-2.5 border-2 border-gray-100 rounded-xl outline-none focus:border-indigo-300 transition-all" />
          <input type="number" step="0.5" value={hours} onChange={e => setHours(Number(e.target.value))} placeholder="Horas" className="px-4 py-2.5 border-2 border-gray-100 rounded-xl outline-none focus:border-indigo-300 transition-all" />
          <input type="number" value={freq} onChange={e => setFreq(Number(e.target.value))} placeholder="Qtd. Ciclo" className="px-4 py-2.5 border-2 border-gray-100 rounded-xl outline-none focus:border-indigo-300 transition-all" />
          <div className="md:col-span-2 lg:col-span-4 flex justify-end mt-2">
            <button type="submit" className="bg-indigo-600 text-white font-black py-3 px-10 rounded-xl uppercase text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Adicionar</button>
          </div>
        </form>
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-8 gap-4">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Minhas Disciplinas</h2>
          <div className="flex gap-3">
            <button onClick={handleToggleAll} className="px-5 py-2.5 rounded-xl text-xs font-black border-2 border-gray-100 uppercase hover:bg-gray-50 transition-all">Selecionar Todas</button>
            <button onClick={handleGenerateCycle} disabled={activeSubjectsCount === 0} className="bg-green-600 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase disabled:opacity-30 shadow-lg shadow-green-100 hover:bg-green-700 transition-all">Criar Ciclo</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Matéria</th>
                <th className="px-6 py-4">H</th>
                <th className="px-6 py-4">Q</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(sub => (
                <tr key={sub.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4"><input type="checkbox" checked={sub.isActive} onChange={() => updateSubject(sub.id, { isActive: !sub.isActive })} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /></td>
                  <td className="px-6 py-4">
                    {editingId === sub.id ? (
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-1.5 border-2 border-indigo-100 rounded-lg outline-none font-bold text-sm" />
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-black text-sm uppercase text-gray-700">{sub.name}</span>
                        <span className="text-[9px] text-gray-400 truncate max-w-[180px] font-bold">{sub.notebookUrl || 'Sem link'}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === sub.id ? (
                      <input type="number" step="0.5" value={editHours} onChange={e => setEditHours(Number(e.target.value))} className="w-16 px-2 py-1.5 border-2 border-indigo-100 rounded-lg outline-none font-bold text-sm" />
                    ) : (
                      <span className="font-bold text-gray-600">{sub.totalHours}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === sub.id ? (
                      <input type="number" value={editFreq} onChange={e => setEditFreq(Number(e.target.value))} className="w-16 px-2 py-1.5 border-2 border-indigo-100 rounded-lg outline-none font-bold text-sm" />
                    ) : (
                      <span className="font-bold text-gray-600">{sub.frequency}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      {editingId === sub.id ? (
                        <button onClick={() => saveEditing(sub.id)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all" title="Salvar">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      ) : (
                        <button onClick={() => startEditing(sub)} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Editar">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                      )}
                      <button onClick={() => deleteSubject(sub.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Excluir">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {subjects.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-300 font-black uppercase tracking-widest text-[10px]">Nenhuma disciplina cadastrada.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SubjectTab;
