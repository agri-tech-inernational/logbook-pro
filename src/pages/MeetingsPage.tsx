import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, deleteDoc, getDocs, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Plus, Users, Calendar, Clock, Edit2, Check, User, Trash2, FileText, ArrowRightCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useContext } from 'react';
import { UserContext } from '../App';
import AttachmentManager from '../components/AttachmentManager';

interface Meeting { id: string; title: string; description: string; wayForward?: string; date: string; attendees: string[]; attachments?: any[]; createdAt: any; }
interface Action { id: string; title: string; status: 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'; dueDate: string; actionee: string; reminderDays: number; meetingId?: string; }

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [usersList, setUsersList] = useState<string[]>([]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newWayForward, setNewWayForward] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newAttendees, setNewAttendees] = useState<string[]>([]);
  const [newMeetingActions, setNewMeetingActions] = useState<Partial<Action>[]>([]);
  
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDue, setDraftDue] = useState('');
  const [draftActionee, setDraftActionee] = useState('');
  const [draftReminder, setDraftReminder] = useState<number>(0);

  useEffect(() => {
    const unsubMeetings = onSnapshot(query(collection(db, 'meetings'), orderBy('createdAt', 'desc')), (snapshot) => {
      setMeetings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Meeting[]);
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsersList(snapshot.docs.map(d => d.data().email));
    });
    return () => { unsubMeetings(); unsubUsers(); };
  }, []);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const curDate = newDate || new Date().toISOString().split('T')[0];
    const meetingRef = await addDoc(collection(db, 'meetings'), { title: newTitle, description: newDesc, wayForward: newWayForward, date: curDate, attendees: newAttendees, createdAt: serverTimestamp() });
    
    if (newMeetingActions.length > 0) {
      await Promise.all(newMeetingActions.map(act => addDoc(collection(db, 'actions'), { ...act, meetingId: meetingRef.id, createdAt: serverTimestamp() })));
    }
    
    const qActions = query(collection(db, 'actions'), where('status', '==', 'IN_PROGRESS'));
    const snapshot = await getDocs(qActions);
    const batchPromises = snapshot.docs.map(d => {
       const data = d.data();
       if(data.meetingId && data.meetingId !== meetingRef.id) return updateDoc(doc(db, 'actions', d.id), { meetingId: meetingRef.id });
       return Promise.resolve();
    });
    await Promise.all(batchPromises);

    setNewTitle(''); setNewDesc(''); setNewWayForward(''); setNewDate(''); setNewAttendees([]); setNewMeetingActions([]); setIsAdding(false);
  };

  const addDraftAction = () => {
    if(!draftTitle || !draftDue || !draftActionee) return;
    setNewMeetingActions([...newMeetingActions, { title: draftTitle, dueDate: draftDue, actionee: draftActionee, reminderDays: draftReminder, status: 'IN_PROGRESS' }]);
    setDraftTitle(''); setDraftDue(''); setDraftActionee(''); setDraftReminder(0);
  };

  return (
    <div className="pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">Meeting Intelligence</h2>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-blue-600/80 hover:bg-blue-500 text-white p-3 rounded-[16px] shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-500/50 transition-all"><Plus size={24} /></button>
      </div>
      
      {isAdding && (
         <div className="mb-10 financial-card p-4 animate-in border-l-4 border-l-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
          <form onSubmit={handleCreateMeeting} className="space-y-6">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center pr-4">Title Configuration</label>
              <input className="financial-input w-full text-lg font-bold" placeholder="e.g. Q3 Factory Output Sync" value={newTitle} onChange={e=>setNewTitle(e.target.value)} required autoFocus />
              <input type="date" className="financial-input w-full mt-3 text-sm font-medium" value={newDate} onChange={e=>setNewDate(e.target.value)} required />
            </div>
            
            <div className="pt-2 border-t border-slate-800/60">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center pr-4">Attendees Sync</label>
              <select className="financial-input w-full md:w-2/3 cursor-pointer appearance-none bg-no-repeat mb-3" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394A3B8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 16px center', backgroundSize: '16px'}} value="" onChange={e=>{
                  if(e.target.value && !newAttendees.includes(e.target.value)) setNewAttendees([...newAttendees, e.target.value]);
              }}>
                <option value="" disabled className="bg-slate-900">Select Engineer from Directory to Invite...</option>
                {usersList.map(u => <option key={u} value={u} className="bg-slate-900">{u}</option>)}
              </select>
              <div className="flex flex-wrap gap-2">
                {newAttendees.map(a => (
                  <span key={a} className="bg-blue-900/40 text-blue-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center shadow-sm border border-blue-500/30 backdrop-blur-sm">{a} 
                    <button type="button" onClick={()=>setNewAttendees(newAttendees.filter(x=>x!==a))} className="ml-2 text-rose-400 font-black hover:text-rose-300 transition-colors">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center">Agenda Blueprint</label>
              <textarea className="financial-input w-full resize-none leading-relaxed" rows={4} placeholder="Type the meeting agenda and critical discussion points..." value={newDesc} onChange={e=>setNewDesc(e.target.value)} />
            </div>
            
            <div className="pt-2 border-t border-slate-800/60">
              <label className="block text-[11px] font-black tracking-widest mb-3 flex items-center text-emerald-400">The Way Forward</label>
              <textarea className="financial-input w-full resize-none leading-relaxed border-emerald-500/30 focus:border-emerald-400/80 bg-emerald-900/10 focus:bg-emerald-900/20" rows={3} placeholder="Conclusions and decisions to push forward..." value={newWayForward} onChange={e=>setNewWayForward(e.target.value)} />
            </div>
            
            <div className="pt-2 border-t border-slate-800/60 bg-slate-900/50 -mx-4 px-4 py-5 rounded-b-[16px] backdrop-blur-md">
              <label className="block text-[11px] font-black text-blue-400 uppercase tracking-widest mb-3 shadow-blue-500 drop-shadow-sm">Pre-Assign Actions</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-4 bg-slate-900/80 border border-slate-700/50 rounded-2xl shadow-inner">
                 <div className="col-span-1 md:col-span-2">
                   <input className="financial-input w-full p-2.5 text-sm" placeholder="Define critical task..." value={draftTitle} onChange={e=>setDraftTitle(e.target.value)} />
                 </div>
                 <input type="date" className="financial-input w-full p-2.5 text-sm [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" value={draftDue} onChange={e=>setDraftDue(e.target.value)} />
                 <select className="financial-input w-full p-2.5 text-sm cursor-pointer" value={draftActionee} onChange={e=>setDraftActionee(e.target.value)}>
                    <option value="" disabled className="bg-slate-900">Assign Engineer...</option>
                    {usersList.map(u => <option key={u} value={u} className="bg-slate-900">{u}</option>)}
                 </select>
                 <select className="financial-input w-full p-2.5 text-sm cursor-pointer md:col-span-1" value={draftReminder} onChange={e=>setDraftReminder(parseInt(e.target.value))}>
                    <option value={0} className="bg-slate-900">Alert On Due Date</option>
                    <option value={1} className="bg-slate-900">1 Day Before</option>
                    <option value={2} className="bg-slate-900">2 Days Before</option>
                    <option value={7} className="bg-slate-900">1 Week Before</option>
                 </select>
                 <div className="md:col-span-1 flex items-end justify-end mt-2 md:mt-0">
                   <button type="button" onClick={addDraftAction} disabled={!draftTitle || !draftDue || !draftActionee} className="bg-slate-800 text-white border border-slate-700 font-bold w-full py-2.5 rounded-xl disabled:opacity-50 hover:bg-slate-700 transition-colors shadow-sm">Attach Task</button>
                 </div>
              </div>
              <div className="space-y-2 mb-6">
                {newMeetingActions.map((act, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-800/80 text-sm font-bold text-slate-200 p-3 rounded-xl border border-slate-700 shadow-sm backdrop-blur-sm">
                     <span className="truncate flex-1">{act.title}</span>
                     <span className="text-[10px] text-slate-400 uppercase mx-3">{act.actionee}</span>
                     <button type="button" onClick={()=>setNewMeetingActions(newMeetingActions.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-rose-300"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-blue-500/20 shadow-inner backdrop-blur-md">
                <div className="flex items-center text-[11px] font-bold text-slate-400 bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-lg mb-3 sm:mb-0 w-full sm:w-auto"><ArrowRightCircle size={14} className="mr-2 text-blue-400"/>Overdue Legacy Actions Automigrate</div>
                <div className="flex space-x-3 w-full sm:w-auto">
                  <button type="button" onClick={() => setIsAdding(false)} className="flex-1 sm:flex-none px-6 py-3 font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 sm:flex-none px-6 py-3 font-bold bg-blue-600/90 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/50 transition-all">Create Meeting</button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
      
      <div className="space-y-6">
        {meetings.length === 0 && !isAdding ? <div className="text-center py-16 financial-card border-dashed border-2 border-slate-800 opacity-60"><Users className="mx-auto h-12 w-12 text-slate-600 mb-4"/><p className="font-medium text-slate-500 text-lg">No intelligence logged</p></div>
        : meetings.map(m => <MeetingCard key={m.id} meeting={m} usersList={usersList} />)}
      </div>
    </div>
  );
}

function MeetingCard({ meeting, usersList }: { meeting: Meeting, usersList: string[] }) {
  const { role } = useContext(UserContext);
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(meeting.title);
  const [desc, setDesc] = useState(meeting.description || '');
  const [wayForward, setWayForward] = useState(meeting.wayForward || '');
  const [date, setDate] = useState(meeting.date);
  const [attendees, setAttendees] = useState<string[]>(Array.isArray(meeting.attendees) ? meeting.attendees : (meeting.attendees ? [String(meeting.attendees)] : []));
  
  const [actions, setActions] = useState<Action[]>([]);
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [newActTitle, setNewActTitle] = useState('');
  const [newActDue, setNewActDue] = useState('');
  const [newActActionee, setNewActActionee] = useState('');
  const [newReminderDays, setNewReminderDays] = useState<number>(0);

  useEffect(() => {
    const q = query(collection(db, 'actions'), where('meetingId', '==', meeting.id));
    return onSnapshot(q, (snapshot) => {
      setActions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Action[]);
    });
  }, [meeting.id]);

  const handleSave = async () => {
    await updateDoc(doc(db, 'meetings', meeting.id), { title, description: desc, wayForward, date, attendees });
    setIsEditing(false);
  };
  const handleDelete = async () => { if(confirm("Permanently destruct this meeting and orphan its telemetry?")) deleteDoc(doc(db, 'meetings', meeting.id)); };

  const handleAddAction = async () => {
    if (!newActTitle) return;
    await addDoc(collection(db, 'actions'), { title: newActTitle, dueDate: newActDue, actionee: newActActionee || auth.currentUser?.email || 'Unknown', status: 'IN_PROGRESS', reminderDays: newReminderDays, meetingId: meeting.id, createdAt: serverTimestamp() });
    setIsAddingAction(false); setNewActTitle(''); setNewActDue(''); setNewActActionee(''); setNewReminderDays(0);
  };

  const statusThemes = { 
    IN_PROGRESS: 'bg-indigo-900/40 text-indigo-300 border-indigo-500/30 hover:bg-indigo-900/60', 
    COMPLETED: 'bg-teal-900/40 text-teal-300 border-teal-500/30 hover:bg-teal-900/60', 
    CLOSED: 'bg-slate-900/60 text-slate-500 line-through opacity-60 border-slate-800 hover:bg-slate-800' 
  };

  const showContent = isExpanded || isEditing;

  return (
    <div className="financial-card p-4 animate-in border-l-4 border-l-blue-500 shadow-[0_4px_30px_rgba(59,130,246,0.05)] hover:shadow-[0_8px_40px_rgba(59,130,246,0.1)] transition-all overflow-hidden group">
      <div className={`flex justify-between items-center ${showContent ? 'mb-5 border-b border-slate-800/60 pb-4' : ''}`}>
        <div className="flex-1 mr-4 cursor-pointer" onClick={() => !isEditing && setIsExpanded(!isExpanded)}>
          {isEditing ? (
            <input className="financial-input font-bold text-lg text-white w-full" value={title} onChange={e=>setTitle(e.target.value)} autoFocus />
          ) : (
            <div className="flex items-center">
              <FileText size={18} className={`inline mr-3 shrink-0 transition-colors ${isExpanded ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'}`}/>
              <h3 className={`font-extrabold text-[16px] md:text-[18px] tracking-tight leading-tight drop-shadow-sm transition-colors ${isExpanded ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{meeting.title}</h3>
              {!isExpanded ? <ChevronDown size={18} className="ml-3 text-slate-600 group-hover:text-blue-400/70 transition-colors shrink-0" /> : <ChevronUp size={18} className="ml-3 text-blue-400 shrink-0" />}
              
              {!showContent && (
                <div className="hidden sm:flex ml-auto items-center space-x-3 opacity-60 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-bold text-slate-400 border border-slate-700 bg-slate-800/50 px-2 py-1 rounded shadow-sm">{meeting.date}</span>
                  {actions.length > 0 && <span className="text-[10px] font-bold text-blue-400 border border-blue-900/50 bg-blue-900/20 px-2 py-1 rounded shadow-sm">{actions.length} Tasks</span>}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 shrink-0 z-10">
          {!isEditing ? <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsExpanded(true); }} className="text-slate-500 hover:text-blue-400 p-2 rounded-xl hover:bg-slate-800/80 transition-colors"><Edit2 size={16}/></button>
           : (
             <>
               {isSuperAdmin && <button onClick={handleDelete} className="text-rose-400 bg-rose-900/20 hover:bg-rose-900/40 p-2 rounded-xl border border-rose-500/30 shadow-sm"><Trash2 size={18}/></button>}
               <button onClick={handleSave} className="text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/40 p-2 rounded-xl border border-emerald-500/30 shadow-sm"><Check size={18}/></button>
             </>
           )}
        </div>
      </div>

      {showContent && (
      <div className="animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="mb-6">
        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center pr-4">Agenda</label>
        {isEditing ? (
          <textarea className="financial-input w-full resize-none text-sm leading-relaxed" rows={3} placeholder="Meeting agenda" value={desc} onChange={e=>setDesc(e.target.value)} />
        ) : (
          <div className="text-[14px] text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 leading-relaxed font-medium whitespace-pre-wrap shadow-inner">{desc || <span className="text-slate-500 italic">No agenda specified.</span>}</div>
        )}
      </div>
      
      <div className="mb-6">
        <label className="block text-[11px] font-black tracking-widest mb-1.5 flex items-center pr-4 text-emerald-500 drop-shadow-sm">Way Forward</label>
        {isEditing ? (
          <textarea className="financial-input w-full resize-none text-sm leading-relaxed border-emerald-500/30 bg-emerald-900/10 focus:border-emerald-400" rows={2} placeholder="The way forward conclusions" value={wayForward} onChange={e=>setWayForward(e.target.value)} />
        ) : (
          wayForward && <div className="text-[14px] text-emerald-300 bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/30 leading-relaxed font-bold whitespace-pre-wrap backdrop-blur-sm">{wayForward}</div>
        )}
      </div>

      <div className="flex flex-col gap-4 mb-6 bg-slate-900/60 backdrop-blur-md p-4 rounded-[16px] border border-slate-800/80 shadow-inner">
        <div className="flex items-center w-full">
           <Calendar size={16} className="text-slate-500 mr-3 shrink-0"/>
           {isEditing ? (
             <input type="date" className="financial-input text-sm font-medium w-full max-w-[200px] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" value={date} onChange={e=>setDate(e.target.value)} />
           ) : <span className="text-sm font-bold text-slate-300">{meeting.date || 'TBD'}</span>}
        </div>

        <div className="flex items-start w-full">
           <Users size={16} className="text-slate-500 mr-3 shrink-0 mt-1"/>
           {isEditing ? (
             <div className="w-full">
                <select className="financial-input w-full max-w-sm mb-3 cursor-pointer text-sm" value="" onChange={e=>{
                   if(e.target.value && !attendees.includes(e.target.value)) setAttendees([...attendees, e.target.value]);
                }}>
                  <option value="" disabled className="bg-slate-900">Search global directory...</option>
                  {usersList.map(u => <option key={u} value={u} className="bg-slate-900">{u}</option>)}
                </select>
                <div className="flex flex-wrap gap-2">
                  {attendees.map(a => <span key={a} className="bg-slate-800/80 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 border border-slate-700 flex items-center shadow-sm">{a} <button onClick={()=>setAttendees(attendees.filter(x=>x!==a))} className="ml-2 text-rose-400 font-black hover:text-rose-300">×</button></span>)}
                </div>
             </div>
           ) : (
             <div className="flex flex-wrap gap-2">
               {attendees.length > 0 ? attendees.map(a => <span key={a} className="bg-slate-800/80 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 border border-slate-700 shadow-sm">{a}</span>) : <span className="text-sm font-medium text-slate-600 mt-0.5">None tagged</span>}
             </div>
           )}
        </div>
      </div>
      
      {!isEditing && <AttachmentManager collectionName="meetings" docId={meeting.id} attachments={meeting.attachments} isSuperAdmin={isSuperAdmin} />}

      <div className="mt-8 pt-5 border-t border-slate-800/60">
        <div className="flex justify-between items-center mb-5">
          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest"><Users size={12} className="inline mr-1 opacity-70"/>Actions Registry ({actions.length})</label>
          <button onClick={()=>setIsAddingAction(!isAddingAction)} className="text-blue-400 text-xs font-bold bg-blue-900/20 px-4 py-2 rounded-xl hover:bg-blue-900/40 transition-colors border border-blue-500/30 shadow-sm">&nbsp;&nbsp;+ Expand Assignment&nbsp;&nbsp;</button>
        </div>
        
        {isAddingAction && (
          <div className="bg-slate-900/80 p-5 mb-5 shadow-inner border border-slate-700/50 rounded-2xl backdrop-blur-md">
            <input className="financial-input w-full text-sm font-semibold mb-3 text-white" placeholder="Core Task Title" value={newActTitle} onChange={e=>setNewActTitle(e.target.value)} />
            <div className="grid grid-cols-2 gap-3 mb-3">
               <div>
                 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pr-4">Due Target</label>
                 <input type="date" className="financial-input w-full text-sm font-medium [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" value={newActDue} onChange={e=>setNewActDue(e.target.value)} />
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pr-4">Accountable Engineer</label>
                 <select className="financial-input w-full text-sm font-medium cursor-pointer" value={newActActionee} onChange={e=>setNewActActionee(e.target.value)}>
                    <option value="" disabled className="bg-slate-900">Select...</option>
                    {usersList.map(u => <option key={u} value={u} className="bg-slate-900">{u}</option>)}
                 </select>
               </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pr-4">Alert Mechanics</label>
                <select className="financial-input text-xs font-medium cursor-pointer" value={newReminderDays} onChange={e=>setNewReminderDays(parseInt(e.target.value))}>
                  <option value={0} className="bg-slate-900">Zero Offset</option>
                  <option value={1} className="bg-slate-900">1 Day Lead</option>
                  <option value={2} className="bg-slate-900">2 Days Lead</option>
                  <option value={7} className="bg-slate-900">1 Week Lead</option>
                </select>
              </div>
              <div className="flex gap-2 self-end mt-4 lg:mt-0">
                <button onClick={()=>setIsAddingAction(false)} className="text-xs font-bold text-slate-400 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors shadow-sm">Scrap</button>
                <button onClick={handleAddAction} disabled={!newActTitle || !newActActionee} className="text-xs font-bold px-5 py-2.5 bg-blue-600 border border-blue-500/50 text-white rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-colors disabled:opacity-50">Publish</button>
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
                   {act.actionee && <span className="flex items-center px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700 shadow-sm truncate max-w-[200px]"><User size={11} className="mr-1.5 text-slate-500 shrink-0"/>Engineer: {act.actionee}</span>}
                 </div>
               </div>
               <select className={`text-[10px] font-black uppercase tracking-wider px-3 py-2.5 rounded-xl border cursor-pointer self-start md:self-center shrink-0 shadow-sm transition-colors outline-none appearance-none text-center ${statusThemes[act.status]}`} value={act.status} onChange={e => updateDoc(doc(db, 'actions', act.id), { status: e.target.value })}>
                 <option value="IN_PROGRESS" className="font-bold bg-slate-900 text-indigo-400">In-Progress</option>
                 <option value="COMPLETED" className="font-bold bg-slate-900 text-teal-400">Completed</option>
                 <option value="CLOSED" className="font-bold bg-slate-900 text-slate-500">Closed</option>
               </select>
            </div>
          ))}
          {actions.length === 0 && !isAddingAction && <p className="text-xs font-bold text-slate-600 italic py-2 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-800 shadow-inner">No telemetry assigned.</p>}
        </div>
      </div>
      </div>
      )}
    </div>
  );
}
