import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { LogOut, User as UserIcon, Shield, Info, ChevronRight, Activity, Users } from 'lucide-react';
import { useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { UserContext } from '../App';

export default function SettingsPage() {
  const { role } = useContext(UserContext);
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const [usersList, setUsersList] = useState<{ id: string, email: string, role: string }[]>([]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsersList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any));
    });
    return () => unsub();
  }, [isSuperAdmin]);

  const toggleRole = async (userId: string, currentRole: string) => {
    if (currentRole === 'PENDING') {
      await updateDoc(doc(db, 'users', userId), { role: 'ENGINEER' });
      return;
    }
    const newRole = currentRole === 'SUPER_ADMIN' ? 'ENGINEER' : 'SUPER_ADMIN';
    await updateDoc(doc(db, 'users', userId), { role: newRole });
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch (e) { alert("Failed to secure logout"); }
  };

  return (
    <div className="pb-12">
      <h2 className="text-2xl font-bold text-white tracking-tight mb-6 drop-shadow-sm">System Operations</h2>
      
      <div className="financial-card overflow-hidden mb-6 relative border-emerald-500/30 shadow-[0_8px_30px_rgba(16,185,129,0.1)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="p-6 lg:p-8 flex flex-col md:flex-row md:items-center border-b border-slate-800/80 relative z-10 w-full bg-slate-900/20">
          <div className="h-16 w-16 bg-emerald-900/40 rounded-[16px] flex items-center justify-center text-emerald-400 mb-4 md:mb-0 md:mr-6 border border-emerald-500/30 shadow-sm shrink-0">
            <UserIcon size={32} />
          </div>
          <div>
            <h3 className="font-extrabold text-[20px] text-white tracking-tight mb-1">{auth.currentUser?.email}</h3>
            <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-sm ${isSuperAdmin ? 'text-emerald-400 bg-emerald-900/30 border-emerald-500/40' : 'text-blue-400 bg-blue-900/30 border-blue-500/40'}`}>{role}</span>
          </div>
        </div>
        <div className="p-6 lg:p-8 bg-slate-900/60 relative z-10 backdrop-blur-md">
          <button onClick={handleLogout} className="w-full flex items-center justify-center p-3.5 text-sm md:text-base text-rose-400 font-bold bg-rose-900/20 border border-rose-500/30 rounded-[14px] hover:bg-rose-900/40 hover:border-rose-500/50 transition-all shadow-[0_4px_15px_rgba(225,29,72,0.1)] hover:shadow-[0_8px_25px_rgba(225,29,72,0.2)]">
            <LogOut size={18} className="mr-2" /> Safely Disconnect
          </button>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="financial-card mb-6 p-6 border-blue-500/30 shadow-[0_8px_30px_rgba(59,130,246,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <h3 className="font-extrabold text-white text-[16px] mb-5 flex items-center tracking-tight drop-shadow-sm"><Users className="mr-3 text-blue-400" size={20}/> Secure Access Console</h3>
          <div className="space-y-3 relative z-10">
             {usersList.map(u => (
               <div key={u.id} className="flex items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-slate-700/80 shadow-inner">
                  <div>
                    <p className="font-bold text-white text-[14px] leading-tight flex items-center"><Shield size={14} className="mr-2 text-slate-500"/> {u.email}</p>
                    <span className={`mt-2 inline-block text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${u.role === 'SUPER_ADMIN' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' : u.role === 'PENDING' ? 'bg-amber-900/30 text-amber-500 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-600'}`}>{u.role || 'ENGINEER'}</span>
                  </div>
                  {u.role === 'PENDING' ? (
                     <button onClick={() => toggleRole(u.id, u.role)} className="text-[11px] font-bold text-amber-500 bg-amber-900/20 hover:bg-amber-900/40 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors shadow-[0_0_10px_rgba(245,158,11,0.2)]">Approve Access</button>
                  ) : (
                     <button onClick={() => toggleRole(u.id, u.role || 'ENGINEER')} className="text-[11px] font-bold text-blue-400 bg-blue-900/20 hover:bg-blue-900/40 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-colors">Toggle Role</button>
                  )}
               </div>
             ))}
          </div>
        </div>
      )}

      <div className="financial-card p-2 relative overflow-hidden group border-slate-700/50">
        <div className="flex items-center justify-between p-5 lg:p-6 cursor-default relative z-10 hover:bg-slate-800/40 rounded-[12px] transition-colors">
          <div className="flex items-center">
            <div className="p-3 bg-blue-900/20 rounded-[14px] border border-blue-500/20 shadow-sm mr-5 text-blue-400 transition-colors"><Shield className="w-5 h-5" /></div>
            <div>
              <p className="font-extrabold text-[15px] text-white tracking-tight leading-tight mb-1">Enterprise Security</p>
              <p className="text-[12px] font-medium text-slate-400">SHA-256 Firebase Auth Active</p>
            </div>
          </div>
          <ChevronRight className="text-slate-600 w-5 h-5 shrink-0" />
        </div>
        
        <div className="mx-5 lg:mx-6 h-px bg-slate-800/60 relative z-10"></div>
        
        <div className="flex items-center justify-between p-5 lg:p-6 cursor-default relative z-10 hover:bg-slate-800/40 rounded-[12px] transition-colors">
          <div className="flex items-center">
            <div className="p-3 bg-emerald-900/20 rounded-[14px] border border-emerald-500/20 shadow-sm mr-5 text-emerald-400 transition-colors"><Activity className="w-5 h-5" /></div>
            <div>
              <p className="font-extrabold text-[15px] text-white tracking-tight leading-tight mb-1">Network Telemetry</p>
              <p className="text-[12px] font-medium text-slate-400">14ms Average Latency Ping</p>
            </div>
          </div>
          <ChevronRight className="text-slate-600 w-5 h-5 shrink-0" />
        </div>

        <div className="mx-5 lg:mx-6 h-px bg-slate-800/60 relative z-10"></div>
        
        <div className="flex items-center justify-between p-5 lg:p-6 cursor-default relative z-10 hover:bg-slate-800/40 rounded-[12px] transition-colors">
          <div className="flex items-center">
            <div className="p-3 bg-violet-900/20 rounded-[14px] border border-violet-500/20 shadow-sm mr-5 text-violet-400 transition-colors"><Info className="w-5 h-5" /></div>
            <div>
              <p className="font-extrabold text-[15px] text-white tracking-tight leading-tight mb-1">Application Architecture</p>
              <p className="text-[12px] font-medium text-slate-400">React 18 / Tailwind V4 / Firestore</p>
            </div>
          </div>
          <ChevronRight className="text-slate-600 w-5 h-5 shrink-0" />
        </div>
      </div>
      
      <p className="text-center text-[10px] font-black text-slate-500 mt-10 uppercase tracking-widest drop-shadow-sm">Version 6.0.1 (Command Center Dark OS)</p>
    </div>
  );
}
