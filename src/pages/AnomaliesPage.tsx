import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, deleteDoc, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Plus, AlertTriangle, ShieldAlert, Clock, Edit2, Check, User, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useContext } from 'react';
import { UserContext } from '../App';
import AttachmentManager from '../components/AttachmentManager';

interface Anomaly { id: string; title: string; description: string; severity: string; date: string; attachments?: any[]; createdAt: any; }
interface Action { id: string; title: string; status: 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'; dueDate: string; actionee: string; reminderDays: number; anomalyId?: string; }

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [usersList, setUsersList] = useState<string[]>([]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState('Medium');
  const [newDate, setNewDate] = useState('');

  useEffect(() => {
    const qA = query(collection(db, 'anomalies'), orderBy('createdAt', 'desc'));
    const unsubA = onSnapshot(qA, (snapshot) => {
      setAnomalies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Anomaly[]);
    });
    const unsubU = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsersList(snapshot.docs.map(d => d.data().email));
    });
    return () => { unsubA(); unsubU(); };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const curDate = newDate || new Date().toISOString().split('T')[0];
    await addDoc(collection(db, 'anomalies'), { title: newTitle, description: newDesc, severity: newSeverity, date: curDate, createdAt: serverTimestamp() });
    setNewTitle(''); setNewDesc(''); setNewSeverity('Medium'); setNewDate(''); setIsAdding(false);
  };

  return (
    <div className="pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">Security & Anomalies</h2>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-rose-600/90 hover:bg-rose-500 text-white p-3 rounded-[16px] shadow-[0_0_20px_rgba(225,29,72,0.4)] border border-rose-500/50 transition-all"><Plus size={24} /></button>
      </div>

      {isAdding && (
         <form onSubmit={handleAdd} className="mb-8 financial-card p-4 border-l-4 border-l-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.08)] animate-in">
          <div>
            <label className="block text-[11px] font-black text-rose-400 uppercase tracking-widest mb-2 pr-4 drop-shadow-sm">Incident Designation</label>
            <input className="financial-input w-full text-lg font-bold focus:border-rose-500 border-slate-700/80" placeholder="Define critical anomaly constraint..." value={newTitle} onChange={e=>setNewTitle(e.target.value)} required autoFocus />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <input type="date" className="financial-input text-sm font-medium focus:border-rose-500 border-slate-700/80 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" value={newDate} onChange={e=>setNewDate(e.target.value)} required />
              <select className="financial-input text-sm font-medium focus:border-rose-500 border-rose-500/30 cursor-pointer text-rose-300 bg-rose-900/20 appearance-none" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23FDA4AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 16px center', backgroundSize: '16px'}} value={newSeverity} onChange={e=>setNewSeverity(e.target.value)}>
                <option value="Low" className="font-bold bg-slate-900 text-slate-300">Low Impact Constraint</option>
                <option value="Medium" className="font-bold bg-slate-900 text-amber-400">Medium Security Threat</option>
                <option value="High" className="font-bold bg-slate-900 text-rose-400">High Risk Factor</option>
                <option value="Critical" className="font-bold bg-slate-900 text-rose-500">Critical Factory Priority</option>
              </select>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-slate-800/60">
            <label className="block text-[11px] font-black text-rose-400 uppercase tracking-widest mb-2 pr-4">Detailed Technical Description</label>
            <textarea className="financial-input w-full resize-none leading-relaxed text-sm focus:border-rose-500 border-slate-700/80" rows={4} placeholder="Input full diagnostic description..." value={newDesc} onChange={e=>setNewDesc(e.target.value)} />
          </div>
          <div className="flex justify-end pt-5 mt-5 border-t border-slate-800/80">
            <div className="flex space-x-3 w-full md:w-auto">
              <button type="button" onClick={() => setIsAdding(false)} className="flex-1 md:flex-none px-6 py-2.5 font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-colors">Scrap Alert</button>
              <button type="submit" className="flex-1 md:flex-none px-6 py-2.5 font-bold bg-rose-600/90 hover:bg-rose-500 border border-rose-500/50 text-white rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all">Broadcast Anomaly</button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {anomalies.length === 0 && !isAdding && <div className="text-center py-16 financial-card border-dashed border-2 border-slate-800 opacity-60"><ShieldAlert className="mx-auto h-12 w-12 text-slate-600 mb-4"/><p className="font-medium text-slate-500 text-lg">Factory Systems Nominal</p></div>}
        {anomalies.map(a => <AnomalyCard key={a.id} anomaly={a} usersList={usersList} />)}
      </div>
    </div>
  );
}

function AnomalyCard({ anomaly, usersList }: { anomaly: Anomaly, usersList: string[] }) {
  const { role } = useContext(UserContext);
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(anomaly.title);
  const [desc, setDesc] = useState(anomaly.description || '');
  const [severity, setSeverity] = useState(anomaly.severity);
  const [date, setDate] = useState(anomaly.date);
  
  const [actions, setActions] = useState<Action[]>([]);
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [newActTitle, setNewActTitle] = useState('');
  const [newActDue, setNewActDue] = useState('');
  const [newActActionee, setNewActActionee] = useState('');
  const [newReminderDays, setNewReminderDays] = useState<number>(0);

  useEffect(() => {
    const q = query(collection(db, 'actions'), where('anomalyId', '==', anomaly.id));
    return onSnapshot(q, (snapshot) => {
      setActions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Action[]);
    });
  }, [anomaly.id]);

  const handleSave = async () => {
    await updateDoc(doc(db, 'anomalies', anomaly.id), { title, description: desc, severity, date });
    setIsEditing(false);
  };
  const handleDelete = async () => { if(confirm("Permanently destruct this incident?")) deleteDoc(doc(db, 'anomalies', anomaly.id)); };

  const handleAddAction = async () => {
    if (!newActTitle) return;
    await addDoc(collection(db, 'actions'), { title: newActTitle, dueDate: newActDue, actionee: newActActionee || auth.currentUser?.email || 'Unknown', status: 'IN_PROGRESS', reminderDays: newReminderDays, anomalyId: anomaly.id, createdAt: serverTimestamp() });
    setIsAddingAction(false); setNewActTitle(''); setNewActDue(''); setNewActActionee(''); setNewReminderDays(0);
  };

  const sevColors: Record<string, string> = { Low: 'text-blue-300 bg-blue-900/30 border-blue-500/30', Medium: 'text-amber-300 bg-amber-900/30 border-amber-500/30', High: 'text-rose-300 bg-rose-900/30 border-rose-500/30', Critical: 'text-white bg-rose-600/90 border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.5)] animate-pulse' };
  const statusThemes = { IN_PROGRESS: 'bg-indigo-900/40 text-indigo-300 border-indigo-500/30 hover:bg-indigo-900/60', COMPLETED: 'bg-teal-900/40 text-teal-300 border-teal-500/30 hover:bg-teal-900/60', CLOSED: 'bg-slate-900/60 text-slate-500 line-through opacity-60 border-slate-800 hover:bg-slate-800' };

  const showContent = isExpanded || isEditing;

  return (
    <div className="financial-card p-4 animate-in border-l-4 border-l-rose-500 shadow-[0_4px_30px_rgba(225,29,72,0.04)] hover:shadow-[0_8px_40px_rgba(225,29,72,0.08)] transition-all overflow-hidden group">
      <div className={`flex justify-between items-center ${showContent ? 'mb-5 border-b border-slate-800/60 pb-4' : ''}`}>
        <div className="flex-1 mr-4 cursor-pointer" onClick={() => !isEditing && setIsExpanded(!isExpanded)}>
          {isEditing ? (
            <input className="financial-input font-bold text-lg text-white w-full focus:border-rose-500 border-slate-700/80" value={title} onChange={e=>setTitle(e.target.value)} autoFocus />
          ) : (
            <div className="flex items-center">
              <AlertTriangle size={18} className={`inline mr-3 shrink-0 transition-colors ${isExpanded ? 'text-rose-400' : 'text-slate-500 group-hover:text-rose-400'}`}/>
              <h3 className={`font-extrabold text-[16px] md:text-[18px] tracking-tight leading-tight drop-shadow-sm transition-colors ${isExpanded ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{anomaly.title}</h3>
              {!isExpanded ? <ChevronDown size={18} className="ml-3 text-slate-600 group-hover:text-rose-400/70 transition-colors shrink-0" /> : <ChevronUp size={18} className="ml-3 text-rose-400 shrink-0" />}
              
              {!showContent && (
                <div className="hidden sm:flex ml-auto items-center space-x-3 opacity-60 group-hover:opacity-100 transition-opacity">
                  <span className={`text-[10px] font-bold border px-2 py-1 rounded shadow-sm ${sevColors[anomaly.severity]}`}>{anomaly.severity}</span>
                  <span className="text-[10px] font-bold text-slate-400 border border-slate-700 bg-slate-800/50 px-2 py-1 rounded shadow-sm">{anomaly.date}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 shrink-0 z-10">
          {!isEditing ? <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsExpanded(true); }} className="text-slate-500 hover:text-rose-400 p-2 rounded-xl hover:bg-slate-800/80 transition-colors"><Edit2 size={16}/></button>
           : (
             <>
               {isSuperAdmin && <button onClick={handleDelete} className="text-rose-400 bg-rose-900/20 hover:bg-rose-900/40 p-2 rounded-xl border border-rose-500/30 shadow-sm"><Trash2 size={16}/></button>}
               <button onClick={handleSave} className="text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/40 p-2 rounded-xl border border-emerald-500/30 shadow-sm"><Check size={16}/></button>
             </>
           )}
        </div>
      </div>

      {showContent && (
      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-900/60 backdrop-blur-md p-4 rounded-[16px] border border-slate-800/80 shadow-inner">
         {isEditing ? (
           <select className="financial-input text-sm font-black w-full sm:w-auto cursor-pointer focus:border-rose-500 border-slate-700/80" value={severity} onChange={e=>setSeverity(e.target.value)}>
             <option value="Low" className="bg-slate-900">Severity: Low</option>
             <option value="Medium" className="bg-slate-900">Severity: Medium</option>
             <option value="High" className="bg-slate-900 text-rose-400">Severity: High</option>
             <option value="Critical" className="bg-slate-900 text-rose-500">Severity: Critical</option>
           </select>
         ) : <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-sm ${sevColors[anomaly.severity]}`}>Severity: {anomaly.severity}</span>}
         
         <div className="flex items-center text-slate-400 text-sm ml-0 sm:ml-4 font-bold border-l-0 sm:border-l sm:border-slate-800 sm:pl-4">
           {isEditing ? (
             <input type="date" className="financial-input text-sm py-1.5 focus:border-rose-500 border-slate-700/80 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" value={date} onChange={e=>setDate(e.target.value)} />
           ) : anomaly.date}
         </div>
      </div>

      <div className="mb-6">
        <label className="block text-[11px] font-black text-rose-500/80 uppercase tracking-widest mb-1.5 pr-4">Diagnostic Details</label>
        {isEditing ? (
          <textarea className="financial-input w-full resize-none text-sm leading-relaxed focus:border-rose-500 border-slate-700/80" rows={3} placeholder="Incident intelligence" value={desc} onChange={e=>setDesc(e.target.value)} />
        ) : (
          <div className="text-[14px] text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 leading-relaxed font-medium whitespace-pre-wrap shadow-inner">{desc || <span className="text-slate-600 italic">No description tracked.</span>}</div>
        )}
      </div>
      
      {!isEditing && <AttachmentManager collectionName="anomalies" docId={anomaly.id} attachments={anomaly.attachments} isSuperAdmin={isSuperAdmin} />}

      <div className="mt-8 pt-5 border-t border-slate-800/60">
        <div className="flex justify-between items-center mb-5">
          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Remediation Protocol ({actions.length})</label>
          <button onClick={()=>setIsAddingAction(!isAddingAction)} className="text-emerald-400 text-xs font-bold bg-emerald-900/20 px-4 py-2 rounded-xl hover:bg-emerald-900/40 transition-colors border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]">+ Global Assignment</button>
        </div>
        
        {isAddingAction && (
          <div className="financial-card bg-emerald-900/10 p-5 mb-5 shadow-inner border border-emerald-500/20 backdrop-blur-md rounded-2xl">
            <input className="financial-input w-full text-sm font-semibold mb-3 focus:border-emerald-500 border-slate-700/80 text-white" placeholder="Corrective Objective" value={newActTitle} onChange={e=>setNewActTitle(e.target.value)} />
            <div className="grid grid-cols-2 gap-3 mb-3">
               <div>
                 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pr-4">Push Target</label>
                 <input type="date" className="financial-input w-full text-sm font-medium focus:border-emerald-500 border-slate-700/80 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" value={newActDue} onChange={e=>setNewActDue(e.target.value)} />
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pr-4">Engineer Binding</label>
                 <select className="financial-input w-full text-sm font-medium cursor-pointer focus:border-emerald-500 border-slate-700/80 appearance-none text-white" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394A3B8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 16px center', backgroundSize: '16px'}} value={newActActionee} onChange={e=>setNewActActionee(e.target.value)}>
                    <option value="" disabled className="bg-slate-900">Search Directory...</option>
                    {usersList.map(u => <option key={u} value={u} className="bg-slate-900">{u}</option>)}
                 </select>
               </div>
            </div>
            <div className="flex justify-between items-center mt-4 border-t border-emerald-900/40 pt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pr-4">Alert Trigger</label>
                <select className="financial-input text-xs font-medium cursor-pointer focus:border-emerald-500 border-slate-700/80 text-white" value={newReminderDays} onChange={e=>setNewReminderDays(parseInt(e.target.value))}>
                  <option value={0} className="bg-slate-900">Absolute Zero (Due Date)</option>
                  <option value={1} className="bg-slate-900">1 Day Prior</option>
                  <option value={2} className="bg-slate-900">2 Days Prior</option>
                  <option value={7} className="bg-slate-900">1 Week Prior</option>
                </select>
              </div>
              <div className="flex gap-2 self-end mt-4 lg:mt-0">
                <button onClick={()=>setIsAddingAction(false)} className="text-xs font-bold text-slate-400 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 shadow-sm transition-colors">Scrap</button>
                <button onClick={handleAddAction} disabled={!newActTitle || !newActActionee} className="text-xs font-bold px-5 py-2.5 bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-500/50 text-white rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all">Publish Remedy</button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {actions.map(act => (
            <div key={act.id} className="text-sm flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-900/60 backdrop-blur-sm rounded-[16px] border border-slate-800 shadow-sm hover:border-blue-500/50 transition-all group gap-3">
               <div className="flex-1 min-w-0">
                 <p className={`font-bold truncate ${act.status==='CLOSED' ? 'text-slate-500' : 'text-slate-200'}`}>{act.title}</p>
                 <div className="flex flex-wrap text-[10px] font-bold text-slate-400 mt-2 gap-2">
                   <span className="flex items-center px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700 shadow-sm"><Clock size={11} className="mr-1.5 text-blue-400"/>Target: {act.dueDate || 'ASAP'}</span>
                   {act.actionee && <span className="flex items-center px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700 truncate max-w-[200px] shadow-sm"><User size={11} className="mr-1.5 text-slate-500 shrink-0"/>Engineer: {act.actionee}</span>}
                 </div>
               </div>
               <select className={`text-[10px] font-black uppercase tracking-wider px-3 py-2.5 rounded-xl border cursor-pointer self-start md:self-center shrink-0 shadow-sm outline-none text-center appearance-none transition-colors ${statusThemes[act.status]}`} value={act.status} onChange={e => updateDoc(doc(db, 'actions', act.id), { status: e.target.value })}>
                 <option value="IN_PROGRESS" className="font-bold bg-slate-900 text-indigo-400">In-Progress</option>
                 <option value="COMPLETED" className="font-bold bg-slate-900 text-teal-400">Completed</option>
                 <option value="CLOSED" className="font-bold bg-slate-900 text-slate-500">Closed</option>
               </select>
            </div>
          ))}
          {actions.length === 0 && !isAddingAction && <p className="text-xs font-bold text-slate-600 italic py-2 text-center bg-slate-900/40 rounded-[12px] border border-dashed border-slate-800 shadow-inner">No active recovery procedures assigned.</p>}
        </div>
      </div>
      </div>
      )}
    </div>
  );
}
