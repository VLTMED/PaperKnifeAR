import { useState, useEffect } from 'react'
import { 
  Download as DownloadIcon, 
  Clock as HistoryIcon, Shield as ShieldIcon, Search as SearchIcon, FileText as FileTextIcon, ChevronLeft as ChevronLeftIcon, X as XIcon, Trash2 as Trash2Icon, Calendar as CalendarIcon, HardDrive as HardDriveIcon
} from 'lucide-react'
import { ActivityEntry, getRecentActivity, clearActivity } from '../utils/recentActivity'
import { toast } from 'sonner'

export default function AndroidHistoryView() {
  const [history, setHistory] = useState<ActivityEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const limitSetting = localStorage.getItem('historyLimit')
    const limit = limitSetting === '999' ? 100 : parseInt(limitSetting || '10')
    getRecentActivity(limit).then(setHistory)
  }, [])

  const handleClear = async () => {
    toast('مسح كل السجل؟', {
      id: 'history-wipe-confirm',
      action: {
        label: 'تأكيد',
        onClick: async () => {
          await clearActivity()
          setHistory([])
          toast.success('تم مسح السجل', { id: 'history-wipe-done' })
          toast.dismiss('history-wipe-confirm')
        }
      },
      cancel: {
        label: 'إلغاء',
        onClick: () => toast.dismiss('history-wipe-confirm')
      }
    })
  }

  const filteredHistory = history.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tool.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 بايت'
    const k = 1024
    const sizes = ['بايت', 'كيلوبايت', 'ميغابايت', 'غيغابايت']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#FAFAFA] dark:bg-obsidian-950 pb-32 transition-colors">
      <header className="px-6 pt-[calc(env(safe-area-inset-top)+1rem)] pb-6 sticky top-0 bg-[#FAFAFA]/90 dark:bg-obsidian-950/90 backdrop-blur-xl z-50 border-b border-obsidian-200 dark:border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col text-right">
            <h1 className="text-3xl font-black tracking-tighter dark:text-white font-display-ar">النشاط</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-ember-500 opacity-80">التخزين المحلي نشط</p>
          </div>
          {history.length > 0 && (
            <button 
              onClick={handleClear}
              className="p-3 bg-ember-50 dark:bg-ember-900/20 text-ember-500 rounded-2xl active:scale-90 transition-all shadow-sm"
            >
              <Trash2Icon size={20} />
            </button>
          )}
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-obsidian-500 group-focus-within:text-ember-500 transition-colors">
            <SearchIcon size={18} />
          </div>
          <input 
            type="text"
            placeholder="ابحث في المستندات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            dir="rtl"
            className="w-full bg-obsidian-50 dark:bg-obsidian-900 border border-obsidian-200 dark:border-white/5 rounded-2xl py-4 pr-14 pl-6 text-sm font-bold placeholder:text-obsidian-500 focus:bg-obsidian-50 dark:focus:bg-obsidian-800 shadow-sm outline-none transition-all dark:text-white text-right"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 left-4 flex items-center text-obsidian-500"
            >
              <XIcon size={16} />
            </button>
          )}
        </div>
      </header>

      <main className="px-4 py-6 space-y-2">
        {filteredHistory.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center animate-in fade-in duration-700">
            <div className="w-20 h-20 bg-obsidian-100 dark:bg-obsidian-900 rounded-[2.5rem] flex items-center justify-center text-obsidian-400 mb-6 border border-obsidian-200 dark:border-white/5">
              <HistoryIcon size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black dark:text-white tracking-tight">لا يوجد شيء</h3>
            <p className="text-xs text-obsidian-500 dark:text-obsidian-500 max-w-[200px] mt-2 font-medium leading-relaxed">ستظهر المستندات المعالجة على هذا الجهاز هنا مؤقتاً.</p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div key={item.id} className="p-4 bg-obsidian-50 dark:bg-obsidian-900 rounded-[2rem] border border-obsidian-200 dark:border-white/5 flex items-center gap-4 active:scale-[0.99] transition-all shadow-sm group">
              <div className="flex items-center gap-2 shrink-0">
                 {item.resultUrl && (
                    <a 
                      href={item.resultUrl} 
                      download={item.name} 
                      className="w-10 h-10 bg-ember-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-ember-500/20 active:scale-90 transition-all"
                    >
                      <DownloadIcon size={18} />
                    </a>
                 )}
                 <ChevronLeftIcon size={16} className="text-obsidian-300 dark:text-obsidian-800" />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-xs font-black truncate dark:text-white mb-0.5">{item.name}</p>
                <div className="flex items-center gap-3 justify-end">
                  <div className="flex items-center gap-1 text-[9px] text-obsidian-500 font-bold">
                    <CalendarIcon size={10} /> {formatDate(item.timestamp)}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-obsidian-500 font-bold">
                    <HardDriveIcon size={10} /> {formatSize(item.size)}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-obsidian-500 font-black uppercase tracking-tighter bg-obsidian-100 dark:bg-obsidian-50/5 px-2 py-0.5 rounded-md">
                    {item.tool}
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 bg-obsidian-100 dark:bg-obsidian-800 text-obsidian-500 group-hover:bg-ember-50 dark:group-hover:bg-ember-900/20 group-hover:text-ember-500 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-inner">
                <FileTextIcon size={22} />
              </div>
            </div>
          ))
        )}

        <div className="pt-12 flex flex-col items-center gap-3 pb-10 opacity-30">
           <div className="flex items-center gap-2">
             <ShieldIcon size={14} className="text-emerald-500" />
             <span className="text-[8px] font-black uppercase tracking-[0.2em] text-obsidian-500">بروتوكول الخصوصية</span>
           </div>
           <p className="text-[7px] font-medium text-obsidian-500 max-w-[200px] text-center">
             تتم معالجة المستندات محلياً في بيئتك الخاصة. سجلات النشاط مخزنة على هذا الجهاز فقط.
           </p>
        </div>
      </main>
    </div>
  )
}
