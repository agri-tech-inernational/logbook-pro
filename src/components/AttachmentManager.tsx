import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { storage, db } from '../firebase';
import { Paperclip, Loader2, X, File, Image as ImageIcon, Plus } from 'lucide-react';

interface Attachment { name: string; url: string; type: string; }

export default function AttachmentManager({ collectionName, docId, attachments = [], isSuperAdmin }: { collectionName: string, docId: string, attachments?: Attachment[], isSuperAdmin: boolean }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const storageRef = ref(storage, `attachments/${collectionName}/${docId}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        await new Promise<void>((resolve, reject) => {
           uploadTask.on('state_changed', 
             (snapshot) => setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
             (err) => { console.error("Upload failed", err); reject(); },
             async () => {
               const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
               await updateDoc(doc(db, collectionName, docId), {
                 attachments: arrayUnion({ name: file.name, url: downloadURL, type: file.type })
               });
               resolve();
             }
           );
        });
    }
    setUploading(false); setProgress(0);
  };

  const removeAttachment = async (att: Attachment) => {
    if (!confirm("Permanently delete this encrypted attachment?")) return;
    await updateDoc(doc(db, collectionName, docId), { attachments: arrayRemove(att) });
  };

  return (
    <div className="mt-4 border-t border-slate-800/60 pt-4 w-full">
      <div className="flex justify-between items-center mb-3">
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center"><Paperclip size={12} className="mr-1.5"/> Encrypted Attachments ({attachments.length})</label>
        <label className="cursor-pointer text-xs font-bold text-blue-400 bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-500/30 hover:bg-blue-900/40 transition-colors shadow-sm flex items-center">
           {uploading ? <><Loader2 size={12} className="mr-1.5 animate-spin"/> {Math.round(progress)}%</> : <><Plus size={12} className="mr-1.5"/> Upload File</>}
           <input type="file" multiple className="hidden" onChange={handleFileChange} disabled={uploading}/>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {attachments.map((att, i) => (
          <div key={i} className="flex items-center text-xs bg-slate-900/60 border border-slate-700 p-2 rounded-lg max-w-full hover:border-blue-500/50 transition-colors shadow-sm">
             <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center hover:text-blue-300 text-slate-300 truncate">
                {att.type.startsWith('image/') ? <ImageIcon size={14} className="mr-2 text-emerald-400 shrink-0"/> : <File size={14} className="mr-2 text-blue-400 shrink-0"/>}
                <span className="truncate max-w-[150px] font-medium">{att.name}</span>
             </a>
             {isSuperAdmin && <button onClick={() => removeAttachment(att)} className="ml-3 text-rose-500 hover:text-rose-300 shrink-0 p-1"><X size={14}/></button>}
          </div>
        ))}
        {attachments.length === 0 && !uploading && <div className="text-[10px] font-bold text-slate-600 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-800 shadow-inner">No external datastreams attached.</div>}
      </div>
    </div>
  );
}
