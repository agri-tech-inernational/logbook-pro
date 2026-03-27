import { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc, query, orderBy, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ListTodo, CheckCircle2, Clock, User, Bell, Trash2, Plus } from 'lucide-react';
import { useContext } from 'react';
import { UserContext } from '../App';
import AttachmentManager from '../components/AttachmentManager';

interface Action { id: string; title: string; status: 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'; dueDate: string; actionee: string; reminderDays: number; meetingId?: string; anomalyId?: string; attachments?: any[]; }

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [usersList, setUsersList] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newActionee, setNewActionee] = useState('');
  const [newReminder, setNewReminder] = useState<number>(0);

  useEffect(() => {
    const qActions = query(collection(db, 'actions'), orderBy('createdAt', 'desc'));
    const unsubActions = onSnapshot(qActions, s => setActions(s.docs.map(d => ({ id: d.id, ...d.data() })) as Action[]));
    const unsubUsers = onSnapshot(collection(db, 'users'), s => setUsersList(s.docs.map(d => d.data().email)));
    return () => { unsubActions(); unsubUsers(); };
  }, []);

  const handleCreateGlobalAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newTitle || !newActionee) return;
    const curDate = newDueDate || new Date().toISOString().split('T')[0];
    await addDoc(collection(db, 'actions'), { title: newTitle, dueDate: curDate, actionee: newActionee, status: 'IN_PROGRESS', reminderDays: newReminder, createdAt: serverTimestamp() });
    setNewTitle(''); setNewDueDate(''); setNewActionee(''); setNewReminder(0); setIsAdding(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => { await updateDoc(doc(db, 'actions', id), { status: newStatus }); };
  const handleDelete = async (id: string) => { if(confirm("Permanently destruct this directive?")) await deleteDoc(doc(db, 'actions', id)); };

  const inProg = actions.filter(a => a.status === 'IN_PROGRESS');
  const comp = actions.filter(a => a.status === 'COMPLETED');
  const closed = actions.filter(a => a.status === 'CLOSED');

  const reminderLabels: Record<number, string> = { 0: 'On Due Date', 1: '1 Day Lead', 2: '2 Days Lead', 7: '1 Week Lead' };

  return (
    <div className="pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">Global Directives</h2>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-emerald-600/90 hover:bg-emerald-500 text-white p-3 rounded-[16px] shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-500/50 transition-all"><Plus size={24} /></button>
      </div>

      {isAdding && (
         <form onSubmit={handleCreateGlobalAction} className="mb-8 financial-card p-4 border-l-4 border-l-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.08)] animate-in">
          <div>
            <label className="block text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-2 pr-4 drop-shadow-sm">Executive Mandate</label>
            <input className="financial-input w-full text-lg font-bold focus:border-emerald-500 border-slate-700/80" placeholder="Define critical task..." value={newTitle} onChange={e=>setNewTitle(e.target.value)} required autoFocus />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <input type="date" className="financial-input text-sm font-medium focus:border-emerald-500 border-slate-700/80 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" value={newDueDate} onChange={e=>setNewDueDate(e.target.value)} required />
              <select className="financial-input text-sm font-medium focus:border-emerald-500 border-slate-700/80 cursor-pointer appearance-none text-white" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394A3B8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 16px center', backgroundSize: '16px'}} value={newActionee} onChange={e=>setNewActionee(e.target.value)} required>
                <option value="" disabled className="bg-slate-900">Assign Dedicated Engineer...</option>
                {usersList.map(u => <option key={u} value={u} className="bg-slate-900">{u}</option>)}
              </select>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/60">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pr-4">Notification Telemetry</label>
              <select className="financial-input w-full md:w-1/2 text-sm font-medium focus:border-emerald-500 border-slate-700/80 cursor-pointer text-white" value={newReminder} onChange={e=>setNewReminder(parseInt(e.target.value))}>
                <option value={0} className="bg-slate-900">Zero Offset (On target date)</option>
                <option value={1} className="bg-slate-900">1 Day Early Warning</option>
                <option value={2} className="bg-slate-900">2 Days Early Warning</option>
                <option value={7} className="bg-slate-900">1 Week Strategic Lead</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-5 mt-5 border-t border-slate-800/80">
            <div className="flex space-x-3 w-full md:w-auto">
              <button type="button" onClick={() => setIsAdding(false)} className="flex-1 md:flex-none px-6 py-2.5 font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-colors">Scrap Task</button>
              <button type="submit" className="flex-1 md:flex-none px-6 py-2.5 font-bold bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-500/50 text-white rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all">Publish Directive</button>
            </div>
          </div>
        </form>
      )}

      {actions.length === 0 && !isAdding && <div className="text-center py-16 financial-card border-dashed border-2 border-slate-800 opacity-60"><ListTodo className="mx-auto h-12 w-12 text-slate-600 mb-4"/><p className="font-medium text-slate-500 text-lg">No directives issued</p></div>}

      <div className="space-y-8">
        {inProg.length > 0 && (
          <div>
            <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center drop-shadow-sm"><span className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span> In-Progress Array ({inProg.length})</h3>
            <div className="space-y-3">
              {inProg.map(act => <ActionItem key={act.id} act={act} onChange={handleStatusChange} onDelete={handleDelete} labels={reminderLabels} theme="border-indigo-500/40 bg-indigo-900/10 hover:border-indigo-500" icon={<Clock size={18} className="text-indigo-400 mt-1 shrink-0"/>} selectTheme="bg-indigo-900/40 text-indigo-300 border-indigo-500/40" />)}
            </div>
          </div>
        )}
        
        {comp.length > 0 && (
          <div>
            <h3 className="text-[12px] font-black text-teal-400 uppercase tracking-widest mb-4 flex items-center drop-shadow-sm"><span className="w-2 h-2 rounded-full bg-teal-500 mr-2"></span> Finalized Vector ({comp.length})</h3>
            <div className="space-y-3">
              {comp.map(act => <ActionItem key={act.id} act={act} onChange={handleStatusChange} onDelete={handleDelete} labels={reminderLabels} theme="border-teal-500/30 bg-teal-900/10 hover:border-teal-400/80" icon={<CheckCircle2 size={18} className="text-teal-400 mt-1 shrink-0"/>} selectTheme="bg-teal-900/40 text-teal-300 border-teal-500/40" />)}
            </div>
          </div>
        )}

        {closed.length > 0 && (
          <div>
            <h3 className="text-[12px] font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center"><span className="w-2 h-2 rounded-full bg-slate-700 mr-2"></span> Cold Storage ({closed.length})</h3>
            <div className="space-y-3">
              {closed.map(act => <ActionItem key={act.id} act={act} onChange={handleStatusChange} onDelete={handleDelete} labels={reminderLabels} theme="border-slate-800 bg-slate-900/30 opacity-60 hover:opacity-100" icon={<ListTodo size={18} className="text-slate-600 mt-1 shrink-0"/>} selectTheme="bg-slate-800 text-slate-500 border-slate-700" />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionItem({ act, onChange, onDelete, labels, theme, icon, selectTheme }: { act: Action, onChange: any, onDelete: any, labels: any, theme: string, icon: any, selectTheme: string }) {
  const { role } = useContext(UserContext);
  const isSuperAdmin = role === 'SUPER_ADMIN';
  return (
    <div className={`financial-card p-4 flex flex-col border shadow-sm transition-all group ${theme}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between w-full">
        <div className="flex items-start flex-1 mb-4 sm:mb-0 min-w-0 pr-4">
          {icon}
          <div className="ml-3 flex-1 min-w-0">
            <p className={`font-bold text-base leading-tight ${act.status==='CLOSED'?'line-through text-slate-500':'text-gray-100'} drop-shadow-sm`}>{act.title}</p>
            {(act.meetingId || act.anomalyId) && <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1.5 flex items-center"><span className="bg-emerald-900/50 px-2 py-0.5 rounded border border-emerald-500/30">System Bound</span></p>}
            <div className="flex flex-wrap items-center mt-3 gap-2 text-xs font-bold text-slate-300">
              <span className="flex items-center bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 shadow-sm"><Clock size={12} className="mr-1.5 text-blue-400"/>Target: <strong className="ml-1 text-white">{act.dueDate || 'ASAP'}</strong></span>
              {act.actionee && <span className="flex items-center bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 shadow-sm"><User size={12} className="mr-1.5 text-slate-500"/>Engineer: <strong className="ml-1 text-white truncate max-w-[150px]">{act.actionee}</strong></span>}
              {act.reminderDays !== undefined && <span className="flex items-center text-amber-300 bg-amber-900/20 px-2.5 py-1.5 rounded-lg border border-amber-500/30 shadow-sm"><Bell size={12} className="mr-1.5 text-amber-400"/>Alert: <strong className="ml-1">{labels[act.reminderDays]}</strong></span>}
            </div>
          </div>
        </div>
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:w-auto w-full border-t sm:border-t-0 border-slate-800/60 pt-3 sm:pt-0 shrink-0">
          <select className={`text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl border cursor-pointer outline-none appearance-none text-center shadow-sm w-36 ${selectTheme}`} value={act.status} onChange={e=>onChange(act.id, e.target.value)}>
            <option value="IN_PROGRESS" className="font-bold bg-slate-900 text-indigo-400">In-Progress</option>
            <option value="COMPLETED" className="font-bold bg-slate-900 text-teal-400">Completed</option>
            <option value="CLOSED" className="font-bold bg-slate-900 text-slate-500">Closed</option>
          </select>
          {isSuperAdmin && <button onClick={()=>onDelete(act.id)} className="text-rose-500 hover:text-rose-400 bg-rose-900/20 hover:bg-rose-900/40 p-2 rounded-xl border border-rose-500/30 transition-colors shadow-sm"><Trash2 size={16}/></button>}
        </div>
      </div>
      <AttachmentManager collectionName="actions" docId={act.id} attachments={act.attachments} isSuperAdmin={isSuperAdmin} />
    </div>
  );
}
