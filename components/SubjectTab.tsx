
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
    active.some(s => (s.totalCorrect + s.totalWrong) > 0) ? setShowConfirmModal(true) : addToCycle(active.map(s => s.id), false);
  };

  return (
    <div className="space-y-6">
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-black text-center text-gray-800 mb-2 uppercase tracking-tight">Manter Progresso?</h3>
            <p className="text-center text-gray-500 text-sm mb-8">Deseja que as novas sessões do ciclo comecem com os dados de questões atuais?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { addToCycle(subjects.filter(s => s.isActive).map(s => s.id), true); setShowConfirmModal(false); }} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase text-xs">Sim, manter progresso</button>
              <button onClick={() => { addToCycle(subjects.filter(s => s.isActive).map(s => s.id), false); setShowConfirmModal(false); }} className="w-full bg-white text-gray-400 font-black py-4 rounded-2xl border-2 border-gray-100 uppercase text-xs">Não, zerar ciclo</button>
              <button onClick={() => setShowConfirmModal(false)} className="w-full text-gray-300 font-bold py-2 uppercase text-[10px]">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-black mb-6 text-gray-800 uppercase tracking-tight">Nova Disciplina</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Matéria" className="px-4 py-2.5 border-2 border-gray-100 rounded-xl outline-none" />
          <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Link Caderno" className="px-4 py-2.5 border-2 border-gray-100 rounded-xl outline-none" />
          <input type="number" step="0.5" value={hours} onChange={e => setHours(Number(e.target.value))} placeholder="Horas" className="px-4 py-2.5 border-2 border-gray-100 rounded-xl outline-none" />
          <input type="number" value={freq} onChange={e => setFreq(Number(e.target.value))} placeholder="Freq." className="px-4 py-2.5 border-2 border-gray-100 rounded-xl outline-none" />
          <div className="md:col-span-2 lg:col-span-4 flex justify-end mt-2">
            <button type="submit" className="bg-indigo-600 text-white font-black py-3 px-10 rounded-xl uppercase text-xs">Adicionar</button>
          </div>
        </form>
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-8 gap-4">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Disciplinas</h2>
          <div className="flex gap-3">
            <button onClick={handleToggleAll} className="px-5 py-2.5 rounded-xl text-xs font-black border-2 border-gray-100 uppercase">Selecionar Todas</button>
            <button onClick={handleGenerateCycle} disabled={activeSubjectsCount === 0} className="bg-green-600 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase disabled:opacity-30">Criar Ciclo</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Matéria</th>
                <th className="px-6 py-4">H</th>
                <th className="px-6 py-4">F</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(sub => (
                <tr key={sub.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors">
                  <td className="px-6 py-4"><input type="checkbox" checked={sub.isActive} onChange={() => updateSubject(sub.id, { isActive: !sub.isActive })} className="w-5 h-5 rounded border-gray-300 text-indigo-600" /></td>
                  <td className="px-6 py-4">
                    {editingId === sub.id ? (
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-2 py-1 border rounded" />
                    ) : (
                      <div className="flex flex-col"><span className="font-black text-sm uppercase">{sub.name}</span><span className="text-[9px] text-gray-400 truncate max-w-[120px]">{sub.notebookUrl}</span></div>
                    )}
                  </td>
                  <td className="px-6 py-4">{editingId === sub.id ? <input type="number" step="0.5" value={editHours} onChange={e => setEditHours(Number(e.target.value))} className="w-16 px-1 border rounded" /> : sub.totalHours}</td>
                  <td className="px-6 py-4">{editingId === sub.id ? <input type="number" value={editFreq} onChange={e => setEditFreq(Number(e.target.value))} className="w-12 px-1 border rounded" /> : sub.frequency}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      {editingId === sub.id ? (
                        <button onClick={() => saveEditing(sub.id)} className="text-green-600 font-bold text-xs uppercase">Salvar</button>
                      ) : (
                        <button onClick={() => startEditing(sub)} className="text-indigo-600 font-bold text-xs uppercase">Editar</button>
                      )}
                      <button onClick={() => deleteSubject(sub.id)} className="text-red-500 font-bold text-xs uppercase">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SubjectTab;
