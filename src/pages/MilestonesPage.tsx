import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Target, Check, Trash2, Edit2, TrendingUp } from 'lucide-react';
import { useContext } from 'react';
import { UserContext } from '../App';

interface Milestone { id: string; title: string; progress: number; deadline: string; createdAt: any; }

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProgress, setNewProgress] = useState(0);
  const [newDeadline, setNewDeadline] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'milestones'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setMilestones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Milestone[]);
    });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const curDate = newDeadline || new Date().toISOString().split('T')[0];
    await addDoc(collection(db, 'milestones'), { title: newTitle, progress: newProgress, deadline: curDate, createdAt: serverTimestamp() });
    setNewTitle(''); setNewProgress(0); setNewDeadline(''); setIsAdding(false);
  };

  return (
    <div className="pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">Strategic Milestones</h2>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-violet-600/90 hover:bg-violet-500 text-white p-3 rounded-[16px] shadow-[0_0_20px_rgba(139,92,246,0.4)] border border-violet-500/50 transition-all"><Plus size={24} /></button>
      </div>

      {isAdding && (
         <form onSubmit={handleAdd} className="mb-8 financial-card p-4 border-l-4 border-l-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.08)] animate-in">
          <div>
            <label className="block text-[11px] font-black text-violet-400 uppercase tracking-widest mb-2 pr-4 drop-shadow-sm">Tracking Vector</label>
            <input className="financial-input w-full text-lg font-bold focus:border-violet-500 border-slate-700/80" placeholder="E.g. Core Deployment Phase 1..." value={newTitle} onChange={e=>setNewTitle(e.target.value)} required autoFocus />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <input type="date" className="financial-input text-sm font-medium focus:border-violet-500 border-slate-700/80 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" value={newDeadline} onChange={e=>setNewDeadline(e.target.value)} required />
              <div className="financial-input flex items-center bg-slate-900/40 border-slate-700/80">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest mr-3">Progress</span>
                <input type="range" min="0" max="100" className="w-full accent-violet-500" value={newProgress} onChange={e=>setNewProgress(parseInt(e.target.value))} />
                <span className="ml-3 font-bold text-white w-8 text-right">{newProgress}%</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-5 mt-5 border-t border-slate-800/80">
            <div className="flex space-x-3 w-full md:w-auto">
              <button type="button" onClick={() => setIsAdding(false)} className="flex-1 md:flex-none px-6 py-2.5 font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-colors">Abort Sync</button>
              <button type="submit" className="flex-1 md:flex-none px-6 py-2.5 font-bold bg-violet-600/90 hover:bg-violet-500 border border-violet-500/50 text-white rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all">Establish Vector</button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-5">
        {milestones.length === 0 && !isAdding && <div className="text-center py-16 financial-card border-dashed border-2 border-slate-800 opacity-60"><Target className="mx-auto h-12 w-12 text-slate-600 mb-4"/><p className="font-medium text-slate-500 text-lg">No tracking vectors established</p></div>}
        {milestones.map(m => <MilestoneCard key={m.id} milestone={m} />)}
      </div>
    </div>
  );
}

function MilestoneCard({ milestone }: { milestone: Milestone }) {
  const { role } = useContext(UserContext);
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(milestone.title);
  const [progress, setProgress] = useState(milestone.progress);
  const [deadline, setDeadline] = useState(milestone.deadline);

  const handleSave = async () => { await updateDoc(doc(db, 'milestones', milestone.id), { title, progress, deadline }); setIsEditing(false); };
  const handleDelete = async () => { if(confirm("Permanently destruct tracking metric?")) deleteDoc(doc(db, 'milestones', milestone.id)); };

  const isComplete = progress === 100;

  return (
    <div className={`financial-card p-5 animate-in hover:shadow-[0_8px_30px_rgba(139,92,246,0.1)] transition-all border-l-4 ${isComplete ? 'border-l-emerald-500' : 'border-l-violet-500'}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1 mr-4">
          {isEditing ? (
            <input className="financial-input font-bold text-lg text-white w-full focus:border-violet-500 border-slate-700/80" value={title} onChange={e=>setTitle(e.target.value)} autoFocus />
          ) : <h3 className={`font-extrabold text-[18px] tracking-tight leading-tight flex items-center drop-shadow-sm ${isComplete ? 'text-emerald-400' : 'text-white'}`}><TrendingUp size={18} className={`inline mr-2 mb-0.5 ${isComplete ? 'text-emerald-500' : 'text-violet-500'}`}/>{milestone.title}</h3>}
        </div>
        
        <div className="flex space-x-2 shrink-0">
          {!isEditing ? <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-violet-400 p-2 rounded-xl hover:bg-slate-800/80 transition-colors"><Edit2 size={18}/></button>
           : (
             <>
               {isSuperAdmin && <button onClick={handleDelete} className="text-rose-400 bg-rose-900/20 hover:bg-rose-900/40 p-2 rounded-xl border border-rose-500/30 shadow-sm"><Trash2 size={18}/></button>}
               <button onClick={handleSave} className="text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/40 p-2 rounded-xl border border-emerald-500/30 shadow-sm"><Check size={18}/></button>
             </>
           )}
        </div>
      </div>

      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 shadow-inner backdrop-blur-md">
        <div className="flex justify-between items-center mb-2">
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress Trace</span>
           <span className={`text-xs font-black drop-shadow-sm delay-100 ${isComplete ? 'text-emerald-400' : 'text-white'}`}>{progress}%</span>
        </div>
        <input 
          type="range" 
          min="0" max="100" 
          className="w-full h-2.5 rounded-lg appearance-none cursor-pointer bg-slate-800 border border-slate-700/50 outline-none transition-all shadow-inner relative z-10" 
          style={{
            background: `linear-gradient(to right, ${isComplete ? '#10b981' : '#8b5cf6'} ${progress}%, #1e293b ${progress}%)`
          }}
          value={progress} 
          onChange={e=>setProgress(parseInt(e.target.value))} 
          onMouseUp={e=>updateDoc(doc(db, 'milestones', milestone.id), { progress: parseInt((e.target as HTMLInputElement).value) })}
          onTouchEnd={e=>updateDoc(doc(db, 'milestones', milestone.id), { progress: parseInt((e.target as HTMLInputElement).value) })}
        />
        <style>{`.appearance-none::-webkit-slider-thumb { appearance: none; width: 16px; height: 16px; background: white; border-radius: 50%; cursor: pointer; box-shadow: 0 0 10px rgba(0,0,0,0.5); }`}</style>
      </div>
      
      <div className="mt-5 flex items-center justify-between">
         <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-sm ${isComplete ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' : 'bg-slate-800/80 text-slate-400 border-slate-700'}`}>
           {isComplete ? 'Vector Finalized' : 'In Transit'}
         </span>
         
         <div className="flex items-center">
            {isEditing ? (
               <input type="date" className="financial-input text-xs py-1.5 focus:border-violet-500 border-slate-700/80 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" value={deadline} onChange={e=>setDeadline(e.target.value)} />
            ) : <span className="text-xs font-bold text-slate-300 flex items-center bg-slate-900/50 px-3 py-1.5 rounded-[10px] border border-slate-800 shadow-sm"><Target size={12} className="mr-1.5 text-violet-400"/> Deadline: {milestone.deadline}</span>}
         </div>
      </div>
    </div>
  );
}
