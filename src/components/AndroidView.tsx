import { useNavigate } from 'react-router-dom'
import { 
  ChevronLeft as ChevronLeftIcon,
  FileText as FileTextIcon,
  Layers as LayersIcon, 
  Zap as ZapIcon, 
  Scissors as ScissorsIcon, 
  Lock as LockIcon,
  Moon as MoonIcon, 
  Sun as SunIcon, 
  Upload as UploadIcon,
  LayoutGrid as LayoutGridIcon, 
  ClipboardList
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { getRecentActivity, ActivityEntry } from '../utils/recentActivity'
import { PaperKnifeLogo } from './Logo'

interface AndroidViewProps {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  onFileSelect?: (file: File) => void
}

export default function AndroidView({ theme, toggleTheme, onFileSelect }: AndroidViewProps) {
  const navigate = useNavigate()
  const [history, setHistory] = useState<ActivityEntry[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getRecentActivity(3).then(setHistory)
  }, [])

  const quickActions = [
    { title: 'دمج', icon: LayersIcon, path: '/merge', color: 'text-ember-500', bg: 'bg-ember-50 dark:bg-ember-900/20', sub: 'ملفات متعددة' },
    { title: 'ضغط', icon: ZapIcon, path: '/compress', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', sub: 'تحسين الحجم' },
    { title: 'تقسيم', icon: ScissorsIcon, path: '/split', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', sub: 'استخراج صفحات' },
    { title: 'حماية', icon: LockIcon, path: '/protect', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', sub: 'تشفير قوي' },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onFileSelect) {
      onFileSelect(file)
    }
  }

  return (
    <div dir="rtl" className="flex flex-col min-h-screen bg-[#FAFAFA] dark:bg-obsidian-950 transition-colors pb-24 text-right">
      <input 
        type="file" 
        accept=".pdf" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      
      {/* رأس الصفحة */}
      <header className="px-6 pt-safe pb-2 sticky top-0 z-50 bg-[#FAFAFA]/95 dark:bg-obsidian-950/95 backdrop-blur-xl border-b border-transparent">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
             <PaperKnifeLogo size={24} iconColor="#D4891A" partColor="currentColor" />
             <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                   <span className="text-lg font-black tracking-tighter text-obsidian-950 dark:text-white leading-none">PaperKnife</span>
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                </div>
                <span className="text-[7px] font-black text-ember-500 uppercase tracking-[0.2em] mt-0.5">محرك آمن</span>
             </div>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-obsidian-100 dark:bg-obsidian-900 text-obsidian-500 dark:text-obsidian-500 active:bg-obsidian-200 dark:active:bg-obsidian-800 transition-colors"
          >
            {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
          </button>
        </div>
      </header>

      <main className="px-4 py-2 space-y-6 flex-1 overflow-y-auto scrollbar-hide">
        
        {/* بطل مركز الأوامر */}
        <section>
           <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-obsidian-900 dark:bg-obsidian-100 rounded-[2.25rem] p-6 text-right relative overflow-hidden shadow-xl shadow-obsidian-900/10 dark:shadow-[0_0_30px_rgba(212,137,26,0.15)] group active:scale-[0.98] transition-all duration-100"
           >
              <div className="absolute top-0 left-0 w-64 h-64 bg-ember-500 rounded-full blur-[80px] -ml-20 -mt-20 opacity-20 dark:opacity-[0.08] pointer-events-none" />
              
              <div className="relative z-10">
                 <div className="flex justify-between items-start mb-12">
                    <div className="px-3 py-1.5 bg-ember-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                       بدء الجلسة
                    </div>
                    <div className="p-3.5 bg-obsidian-50/10 dark:bg-obsidian-950/5 rounded-2xl backdrop-blur-md text-white dark:text-obsidian-950 border border-white/5 dark:border-obsidian-950/5">
                       <UploadIcon size={28} strokeWidth={2.5} />
                    </div>
                 </div>
                 <div>
                    <h2 className="text-3xl font-black text-white dark:text-obsidian-950 tracking-tight leading-none mb-2 font-display-ar">اختر ملف PDF</h2>
                    <p className="text-[11px] font-bold text-obsidian-500 dark:text-obsidian-600 uppercase tracking-tight">اضغط للتحميل من ذاكرة الجهاز</p>
                 </div>
              </div>
           </button>
        </section>

        {/* قسم سجل الملفات */}
        {history.length > 0 && (
          <section>
            <div className="flex items-center justify-between px-2 mb-3">
               <button onClick={() => navigate('/android-history')} className="text-[9px] font-black uppercase text-ember-500 tracking-wider">عرض الكل</button>
               <div className="flex items-center gap-2">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-obsidian-500 leading-none">سجل الملفات</h3>
                  <ClipboardList size={12} className="text-obsidian-500" />
               </div>
            </div>
            
            <div className="bg-obsidian-50 dark:bg-obsidian-900 rounded-[2rem] border border-obsidian-200 dark:border-white/5 shadow-sm divide-y divide-obsidian-100 dark:divide-white/5 overflow-hidden">
              {history.map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => navigate('/android-history')}
                  className="w-full p-4 flex items-center gap-4 active:bg-obsidian-100 dark:active:bg-obsidian-50/5 transition-colors text-right"
                >
                  <ChevronLeftIcon size={14} className="text-obsidian-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-obsidian-950 dark:text-white leading-tight mb-0.5">{item.name}</p>
                    <div className="flex items-center gap-2 flex-row-reverse justify-end">
                       <span className="text-[9px] text-ember-500 font-black uppercase tracking-tight">{item.tool}</span>
                       <span className="text-[14px] text-obsidian-300 dark:text-obsidian-800 leading-none">•</span>
                       <span className="text-[9px] text-obsidian-500 font-bold uppercase tracking-tight">{(item.size / (1024*1024)).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-obsidian-100 dark:bg-obsidian-50/5 rounded-xl flex items-center justify-center text-obsidian-500 dark:text-obsidian-500 shrink-0">
                    <FileTextIcon size={18} />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* شبكة الأدوات السريعة */}
        <section>
           <div className="px-2 mb-3 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-obsidian-500">الأدوات الرئيسية</span>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
             {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={() => navigate(action.path)}
                  className="p-5 bg-obsidian-50 dark:bg-obsidian-900 rounded-[2rem] border border-obsidian-200 dark:border-white/5 flex flex-col justify-between h-32 shadow-sm active:bg-obsidian-100 dark:active:bg-obsidian-50/5 transition-colors text-right relative overflow-hidden"
                >
                  <div className={`w-10 h-10 ${action.bg} ${action.color} rounded-xl flex items-center justify-center mb-2 self-end`}>
                    <action.icon size={20} strokeWidth={2.5} />
                  </div>
                  <div className="relative z-10">
                     <span className="text-sm font-black text-obsidian-950 dark:text-white block leading-none mb-1">{action.title}</span>
                     <span className="text-[9px] font-bold text-obsidian-500 uppercase tracking-tight">{action.sub}</span>
                  </div>
                </button>
              ))}

              <button
                onClick={() => navigate('/android-tools')}
                className="col-span-2 p-5 bg-ember-500 text-white rounded-[2rem] flex items-center justify-between shadow-lg shadow-ember-500/20 active:bg-ember-600 transition-colors group relative overflow-hidden"
              >
                 <div className="absolute left-0 top-0 p-4 opacity-10 pointer-events-none">
                    <LayoutGridIcon size={100} />
                 </div>
                 <div className="w-8 h-8 bg-obsidian-50/10 rounded-full flex items-center justify-center relative z-10">
                    <ChevronLeftIcon size={16} />
                 </div>
                 <div className="flex items-center gap-4 relative z-10">
                    <div>
                       <span className="text-sm font-black block leading-none mb-1">المزيد من الأدوات</span>
                       <span className="text-[9px] font-bold opacity-80 uppercase tracking-widest">الكتالوج الكامل</span>
                    </div>
                    <div className="w-10 h-10 bg-obsidian-50/20 rounded-xl flex items-center justify-center">
                       <LayoutGridIcon size={20} strokeWidth={2.5} />
                    </div>
                 </div>
              </button>
           </div>
        </section>

        {/* تذييل الصفحة */}
        <div className="flex flex-col items-center gap-2 py-8 opacity-20">
           <p className="text-[8px] font-black uppercase tracking-[0.4em] dark:text-white text-center">PaperKnife v1.0.9</p>
        </div>

      </main>
    </div>
  )
}
