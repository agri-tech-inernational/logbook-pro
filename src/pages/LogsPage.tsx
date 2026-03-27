import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, BookOpen, Clock, FileText, Check, Edit2, Trash2 } from 'lucide-react';
import { useContext } from 'react';
import { UserContext } from '../App';

interface Log { id: string; content: string; createdAt: any; date: string; }

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [newLog, setNewLog] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'logs'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Log[]);
    });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.trim()) return;
    await addDoc(collection(db, 'logs'), { content: newLog, date: new Date().toISOString().split('T')[0], createdAt: serverTimestamp() });
    setNewLog(''); setIsAdding(false);
  };

  return (
    <div className="pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">Intelligence Logs</h2>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-blue-600/90 hover:bg-blue-500 text-white p-3 rounded-[16px] shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-blue-500/50 transition-all"><Plus size={24} /></button>
      </div>

      {isAdding && (
         <form onSubmit={handleAdd} className="mb-8 financial-card p-4 border-l-4 border-l-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.08)] animate-in">
          <div>
            <label className="block text-[11px] font-black text-blue-400 uppercase tracking-widest mb-2 pr-4 drop-shadow-sm">Write encrypted log sector</label>
            <textarea className="financial-input w-full resize-none leading-relaxed text-[15px] focus:border-blue-500 border-slate-700/80" rows={5} placeholder="Document operational footprint..." value={newLog} onChange={e=>setNewLog(e.target.value)} required autoFocus />
          </div>
          <div className="flex justify-end pt-5 mt-4 border-t border-slate-800/80">
            <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2.5 mr-3 font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-colors">Discard</button>
            <button type="submit" className="px-6 py-2.5 font-bold bg-blue-600/90 hover:bg-blue-500 border border-blue-500/50 text-white rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all">Append Log</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {logs.length === 0 && !isAdding && <div className="text-center py-16 financial-card border-dashed border-2 border-slate-800 opacity-60"><BookOpen className="mx-auto h-12 w-12 text-slate-600 mb-4"/><p className="font-medium text-slate-500 text-lg">System datastore is empty</p></div>}
        {logs.map(log => <LogItem key={log.id} log={log} />)}
      </div>
    </div>
  );
}

function LogItem({ log }: { log: Log }) {
  const { role } = useContext(UserContext);
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(log.content);

  const handleSave = async () => { await updateDoc(doc(db, 'logs', log.id), { content }); setIsEditing(false); };
  const handleDelete = async () => { if(confirm("Erase log forever?")) deleteDoc(doc(db, 'logs', log.id)); };

  return (
    <div className="financial-card p-5 animate-in hover:border-blue-500/40 shadow-sm transition-all group overflow-hidden relative">
      <div className="flex justify-between items-start">
        <div className="flex items-start flex-1 text-[15px] leading-relaxed font-medium">
          <FileText className="text-blue-500 mt-1 mr-3 shrink-0" size={18} />
          {isEditing ? (
            <textarea className="financial-input w-full resize-none focus:border-blue-500 border-slate-700/80 text-white" rows={6} value={content} onChange={e=>setContent(e.target.value)} autoFocus />
          ) : <p className="text-slate-300 font-medium whitespace-pre-wrap">{log.content}</p> }
        </div>
        <div className="flex space-x-2 shrink-0 ml-4">
           {!isEditing ? <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-blue-400 p-2 rounded-xl hover:bg-slate-800/80 transition-colors opacity-0 group-hover:opacity-100"><Edit2 size={16}/></button>
           : (
             <div className="flex flex-col gap-2">
               <button onClick={handleSave} className="text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/40 p-2 rounded-xl border border-emerald-500/30 shadow-sm"><Check size={16}/></button>
               {isSuperAdmin && <button onClick={handleDelete} className="text-rose-400 bg-rose-900/20 hover:bg-rose-900/40 p-2 rounded-xl border border-rose-500/30 shadow-sm"><Trash2 size={16}/></button>}
             </div>
           )}
        </div>
      </div>
      {!isEditing && (
        <div className="mt-4 pt-4 flex items-center text-[10px] font-bold text-slate-500 border-t border-slate-800/60 uppercase tracking-widest pl-1">
          <Clock size={12} className="mr-1.5"/> Logged: {log.date}
        </div>
      )}
    </div>
  );
}
