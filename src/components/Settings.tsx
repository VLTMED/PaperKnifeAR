import { useState } from 'react'
import { 
  Trash2, Clock, Moon, Sun, Monitor,
  ChevronLeft, Info, Zap, User, DownloadCloud, ListFilter,
  RotateCcw, ShieldCheck, Bug, Heart as HeartIcon, Settings2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clearActivity } from '../utils/recentActivity'
import { toast } from 'sonner'
import { Theme } from '../types'
import { NativeToolLayout } from './tools/shared/NativeToolLayout'
import { hapticImpact } from '../utils/haptics'

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onChange() }}
    className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${checked ? 'bg-rose-500 shadow-lg shadow-rose-500/20' : 'bg-gray-200 dark:bg-zinc-700'}`}
  >
    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
)

const SettingItem = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  action, 
  onClick,
  danger,
  iconColor
}: { 
  icon: any, 
  title: string, 
  subtitle?: string, 
  action?: React.ReactNode,
  onClick?: () => void,
  danger?: boolean,
  iconColor?: string
}) => {
  const Container = onClick ? 'button' : 'div'
  return (
    <Container 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 px-5 transition-all text-right group ${onClick ? 'active:bg-gray-50 dark:active:bg-white/5 cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-center gap-3 shrink-0">
        {action}
        {onClick && !action && <ChevronLeft size={16} className="text-gray-300" />}
      </div>
      <div className="flex items-center gap-4 flex-1 overflow-hidden justify-end">
        <div className="min-w-0 flex-1 text-right">
          <h4 className={`text-[13px] font-black truncate mb-0.5 tracking-tight ${danger ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{title}</h4>
          {subtitle && <p className="text-[10px] text-gray-500 dark:text-zinc-500 font-bold uppercase tracking-tight truncate">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${danger ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : (iconColor || 'bg-gray-100 dark:bg-zinc-800 text-gray-500 group-hover:text-rose-500 group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20')}`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
      </div>
    </Container>
  )
}

const SettingGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="px-6 mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-zinc-600 text-right">{title}</h3>
    <div className="bg-white dark:bg-zinc-900 rounded-[2.25rem] border border-gray-100 dark:border-white/5 divide-y divide-gray-50 dark:divide-white/5 shadow-sm overflow-hidden">
      {children}
    </div>
  </div>
)

export default function Settings({ theme, setTheme }: { theme: Theme, setTheme: (t: Theme) => void }) {
  const navigate = useNavigate()
  
  const [autoWipe, setAutoWipe] = useState(localStorage.getItem('autoWipe') === 'true')
  const [wipeTimer, setWipeTimer] = useState(localStorage.getItem('autoWipeTimer') || '15')
  const [haptics, setHaptics] = useState(localStorage.getItem('hapticsEnabled') === 'true')
  const [autoDownload, setAutoDownload] = useState(localStorage.getItem('autoDownload') === 'true')
  const [historyLimit, setHistoryLimit] = useState(localStorage.getItem('historyLimit') || '10')
  const [defaultAuthor, setDefaultAuthor] = useState(localStorage.getItem('defaultAuthor') || '')

  const handleToggle = (key: string, currentVal: boolean, setter: (v: boolean) => void) => {
    const newVal = !currentVal
    localStorage.setItem(key, String(newVal))
    setter(newVal)
    hapticImpact()
    toast.success('تم حفظ الإعدادات')
  }

  const handleSelect = (key: string, val: string, setter: (v: string) => void) => {
    localStorage.setItem(key, val)
    setter(val)
    hapticImpact()
    toast.success('تم حفظ الإعدادات')
  }

  const restoreDefaults = () => {
    if (confirm("استعادة جميع الإعدادات إلى الافتراضي؟")) {
      localStorage.clear()
      localStorage.setItem('theme', 'system')
      window.location.reload()
    }
  }

  return (
    <NativeToolLayout title="النظام" description="الإعدادات الأساسية" actions={null}>
      <div dir="rtl" className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-40">
        
        <div className="flex items-center gap-4 px-2 mb-8 mt-2 flex-row-reverse">
           <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 text-white shrink-0">
              <Settings2 size={24} strokeWidth={2.5} />
           </div>
           <div className="text-right">
              <h2 className="text-xl font-black dark:text-white tracking-tighter leading-none mb-1">التفضيلات</h2>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">البروتوكول v1.0.9 • محلي</p>
           </div>
        </div>

        <SettingGroup title="الواجهة">
          <div className="p-2 grid grid-cols-3 gap-2">
            {[
              { id: 'light', icon: Sun, label: 'فاتح' },
              { id: 'dark', icon: Moon, label: 'داكن' },
              { id: 'system', icon: Monitor, label: 'النظام' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id as Theme)
                  hapticImpact()
                }}
                className={`flex flex-col items-center gap-2 py-3.5 rounded-[1.25rem] transition-all border border-transparent ${theme === t.id ? 'bg-zinc-950 dark:bg-white text-white dark:text-black shadow-xl scale-[1.02]' : 'bg-gray-50 dark:bg-black/40 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
              >
                <t.icon size={18} strokeWidth={2.5} />
                <span className="text-[9px] font-black uppercase tracking-[0.1em]">{t.label}</span>
              </button>
            ))}
          </div>
          <SettingItem 
            icon={Zap} 
            title="الاهتزاز اللمسي" 
            subtitle="محرك الاستجابة اللمسية"
            action={<ToggleSwitch checked={haptics} onChange={() => handleToggle('hapticsEnabled', haptics, setHaptics)} />}
          />
        </SettingGroup>

        <SettingGroup title="سير العمل">
          <SettingItem 
            icon={DownloadCloud} 
            title="تحميل تلقائي" 
            subtitle="تصدير النتائج فوراً"
            action={<ToggleSwitch checked={autoDownload} onChange={() => handleToggle('autoDownload', autoDownload, setAutoDownload)} />}
          />
          <div className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-gray-900 dark:text-white justify-end">
               <span className="text-[11px] font-black uppercase tracking-tight">بيانات المؤلف الافتراضية</span>
               <User size={16} className="text-rose-500" />
            </div>
            <input 
              type="text"
              value={defaultAuthor}
              onChange={(e) => {
                setDefaultAuthor(e.target.value)
                localStorage.setItem('defaultAuthor', e.target.value)
              }}
              placeholder="مثال: اسمك"
              dir="rtl"
              className="w-full bg-gray-100 dark:bg-black border border-transparent focus:border-rose-500 rounded-xl px-4 py-3.5 text-xs font-black outline-none transition-all placeholder:text-gray-400 dark:text-white text-right"
            />
          </div>
        </SettingGroup>

        <SettingGroup title="الخصوصية">
          <SettingItem 
            icon={Clock} 
            title="مسح تلقائي للسجل" 
            subtitle="مسح النشاط عند الاغلاق"
            action={<ToggleSwitch checked={autoWipe} onChange={() => handleToggle('autoWipe', autoWipe, setAutoWipe)} />}
          />
          {autoWipe && (
            <div className="px-5 py-3 flex items-center justify-between bg-rose-50/50 dark:bg-rose-900/10 border-t border-rose-100/20 dark:border-rose-900/20 animate-in slide-in-from-top-2">
               <select 
                value={wipeTimer}
                onChange={(e) => handleSelect('autoWipeTimer', e.target.value, setWipeTimer)}
                className="bg-transparent text-[11px] font-black text-rose-600 outline-none cursor-pointer"
               >
                  <option value="0">فوراً</option>
                  <option value="1">بعد دقيقة</option>
                  <option value="5">بعد 5 دقائق</option>
                  <option value="15">بعد 15 دقيقة</option>
                  <option value="30">بعد 30 دقيقة</option>
               </select>
               <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">تأخير المسح</span>
            </div>
          )}
          <div className="px-5 py-4 flex items-center justify-between">
             <select 
              value={historyLimit}
              onChange={(e) => handleSelect('historyLimit', e.target.value, setHistoryLimit)}
              className="bg-gray-100 dark:bg-black px-3 py-2 rounded-xl text-[11px] font-black text-gray-600 dark:text-gray-300 outline-none border border-transparent focus:border-rose-500 cursor-pointer"
             >
                <option value="5">5 ملفات</option>
                <option value="10">10 ملفات</option>
                <option value="20">20 ملفًا</option>
                <option value="50">50 ملفًا</option>
                <option value="999">غير محدود</option>
             </select>
             <div className="flex items-center gap-4">
                <div className="text-right">
                  <h4 className="text-[13px] font-black text-gray-900 dark:text-white leading-none">حد السجل</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-1">الملفات المحفوظة</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-gray-500">
                  <ListFilter size={18} />
                </div>
             </div>
          </div>
        </SettingGroup>

        <SettingGroup title="النظام البيئي">
          <SettingItem 
            icon={HeartIcon} 
            title="دعم المشروع" 
            subtitle="ساهم في تطوير التطبيق"
            iconColor="text-rose-500 bg-rose-50 dark:bg-rose-900/20"
            onClick={() => window.open('https://github.com/sponsors/potatameister', '_blank')}
          />
          <SettingItem 
            icon={Bug} 
            title="الإبلاغ عن مشكلة" 
            subtitle="متتبع GitHub"
            onClick={() => window.open('https://github.com/potatameister/PaperKnife/issues', '_blank')}
          />
          <SettingItem 
            icon={Info} 
            title="حول PaperKnife" 
            subtitle="تفاصيل البروتوكول"
            onClick={() => navigate('/about')}
          />
          <SettingItem 
            icon={ShieldCheck} 
            title="بروتوكول الخصوصية" 
            subtitle="مواصفات التعامل مع البيانات"
            onClick={() => navigate('/privacy')}
          />
        </SettingGroup>

        <div className="mt-12">
           <h3 className="px-6 mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-red-500 text-right">منطقة الخطر</h3>
           <div className="bg-white dark:bg-zinc-900 rounded-[2.25rem] border border-red-100 dark:border-red-900/20 divide-y divide-red-50 dark:divide-red-900/10 shadow-sm overflow-hidden mb-4">
              <SettingItem 
                icon={RotateCcw} 
                title="استعادة الافتراضي" 
                subtitle="إعادة ضبط التفضيلات" 
                onClick={restoreDefaults}
                iconColor="text-gray-500 bg-gray-100 dark:bg-zinc-800"
              />
              <SettingItem 
                icon={Trash2} 
                title="حذف كل البيانات" 
                subtitle="مسح نهائي لا يمكن التراجع عنه" 
                danger
                onClick={async () => {
                  if(confirm("تحذير: سيتم حذف سجلك وإعادة ضبط جميع الإعدادات نهائياً. هل تريد المتابعة؟")) {
                    await clearActivity()
                    localStorage.clear()
                    window.location.reload()
                  }
                }}
              />
           </div>
           <p className="text-[8px] font-black uppercase text-center text-gray-300 dark:text-zinc-700 tracking-[0.5em] mt-10">محرك الإعدادات v1.0.9 مستقر</p>
        </div>

      </div>
    </NativeToolLayout>
  )
}
