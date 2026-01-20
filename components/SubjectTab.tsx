
import React, { useState } from 'react';
import { Subject } from '../types';

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
    addSubject({
      name,
      notebookUrl: url,
      totalHours: hours,
      frequency: freq,
      isActive: true
    });
    setName('');
    setUrl('');
    setHours(1);
    setFreq(1);
  };

  const startEditing = (sub: Subject) => {
    setEditingId(sub.id);
    setEditName(sub.name);
    setEditUrl(sub.notebookUrl);
    setEditHours(sub.totalHours);
    setEditFreq(sub.frequency);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = (id: string) => {
    updateSubject(id, {
      name: editName,
      notebookUrl: editUrl,
      totalHours: editHours,
      frequency: editFreq
    });
    setEditingId(null);
  };

  const activeSubjectsCount = subjects.filter(s => s.isActive).length;

  const handleToggleAll = () => {
    const shouldActivate = activeSubjectsCount !== subjects.length;
    toggleAllSubjects(shouldActivate);
  };

  const handleGenerateCycle = () => {
    const activeSubjects = subjects.filter(s => s.isActive);
    if (activeSubjects.length === 0) return;

    // Se houver qualquer matéria com progresso, pergunta o que fazer
    const hasAnyProgress = activeSubjects.some(s => (s.totalCorrect + s.totalWrong) > 0);
    
    if (hasAnyProgress) {
      setShowConfirmModal(true);
    } else {
      addToCycle(activeSubjects.map(s => s.id), false);
    }
  };

  const confirmCycleCreation = (keepProgress: boolean) => {
    const activeIds = subjects.filter(s => s.isActive).map(s => s.id);
    addToCycle(activeIds, keepProgress);
    setShowConfirmModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Modal de Confirmação de Progresso */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-center text-gray-800 mb-2 uppercase tracking-tight">Manter Progresso?</h3>
            <p className="text-center text-gray-500 text-sm mb-8">
              Você já possui registros de questões nessas matérias. Deseja que as novas sessões do ciclo comecem com esses dados?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => confirmCycleCreation(true)}
                className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase text-xs"
              >
                Sim, manter progresso existente
              </button>
              <button
                onClick={() => confirmCycleCreation(false)}
                className="w-full bg-white text-gray-400 font-black py-4 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 transition-all uppercase text-xs"
              >
                Não, zerar para este novo ciclo
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full text-gray-300 font-bold py-2 hover:text-gray-400 transition-all uppercase text-[10px]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-black mb-6 text-gray-800 uppercase tracking-tight">Nova Disciplina</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Matéria</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Direito Penal"
              className="px-4 py-2.5 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Link do Caderno</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              className="px-4 py-2.5 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Horas</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={hours}
              onChange={e => setHours(Number(e.target.value))}
              className="px-4 py-2.5 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Frequência</label>
            <input
              type="number"
              min="1"
              value={freq}
              onChange={e => setFreq(Number(e.target.value))}
              className="px-4 py-2.5 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-4 flex justify-end mt-2">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-10 rounded-xl transition-all shadow-lg shadow-indigo-100 active:scale-95 uppercase text-xs"
            >
              Adicionar
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Gerenciar Matérias</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={handleToggleAll}
              className="text-gray-500 hover:bg-gray-100 px-5 py-2.5 rounded-xl text-xs font-black transition-all border-2 border-gray-100 uppercase"
            >
              {activeSubjectsCount === subjects.length ? 'Desmarcar' : 'Selecionar Todas'}
            </button>
            <button
              onClick={handleGenerateCycle}
              disabled={activeSubjectsCount === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-30 shadow-lg shadow-green-100 uppercase"
            >
              Criar Ciclo ({activeSubjectsCount})
            </button>
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="text-center py-20 text-gray-300 font-medium uppercase tracking-widest text-sm">
            Nenhuma disciplina cadastrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-gray-50">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ciclo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Matéria / Caderno</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">Horas</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">Freq.</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-32 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(sub => (
                  <tr key={sub.id} className="group border-b border-gray-50 hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => updateSubject(sub.id, { isActive: !sub.isActive })}
                        className={`w-12 h-6 rounded-full transition-all flex items-center p-1 ${sub.isActive ? 'bg-indigo-500' : 'bg-gray-200'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${sub.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === sub.id ? (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="px-3 py-1.5 text-sm border-2 border-indigo-100 rounded-lg focus:border-indigo-500 outline-none"
                            placeholder="Nome"
                          />
                          <input
                            type="url"
                            value={editUrl}
                            onChange={e => setEditUrl(e.target.value)}
                            className="px-3 py-1 text-[10px] border-2 border-indigo-100 rounded-lg focus:border-indigo-500 outline-none"
                            placeholder="Link do Caderno"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-black text-gray-800 text-sm uppercase">{sub.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {sub.notebookUrl && (
                              <span className="text-[10px] font-bold text-indigo-400 truncate block max-w-[150px]">
                                {sub.notebookUrl}
                              </span>
                            )}
                            <span className="text-[9px] font-black text-gray-300 uppercase">Q: {sub.totalCorrect + sub.totalWrong}</span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === sub.id ? (
                        <input
                          type="number"
                          step="0.5"
                          value={editHours}
                          onChange={e => setEditHours(Number(e.target.value))}
                          className="w-full px-2 py-1 text-sm border-2 border-indigo-100 rounded-lg outline-none"
                        />
                      ) : (
                        <span className="text-gray-600 font-bold">{sub.totalHours}h</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === sub.id ? (
                        <input
                          type="number"
                          value={editFreq}
                          onChange={e => setEditFreq(Number(e.target.value))}
                          className="w-full px-2 py-1 text-sm border-2 border-indigo-100 rounded-lg outline-none"
                        />
                      ) : (
                        <span className="text-gray-600 font-bold">{sub.frequency}x</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {editingId === sub.id ? (
                          <>
                            <button onClick={() => saveEditing(sub.id)} className="bg-green-500 text-white p-2 rounded-lg shadow-md shadow-green-100">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button onClick={cancelEditing} className="bg-gray-300 text-white p-2 rounded-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditing(sub)} className="text-indigo-400 hover:text-indigo-600 p-2 rounded-xl hover:bg-white transition-all">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onClick={() => deleteSubject(sub.id)} className="text-red-300 hover:text-red-500 p-2 rounded-xl hover:bg-white transition-all">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default SubjectTab;
