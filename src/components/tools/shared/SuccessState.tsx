import { Download, Eye, CheckCircle2, Share2, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { downloadFile, shareFile } from '../../../utils/pdfHelpers'
import { Capacitor } from '@capacitor/core'
import { hapticSuccess } from '../../../utils/haptics'
import PdfPreview from '../../PdfPreview'

interface SuccessStateProps {
  message: string
  downloadUrl: string
  fileName: string
  onStartOver: () => void
  showPreview?: boolean
}

export default function SuccessState({ message, downloadUrl, fileName, onStartOver, showPreview = true }: SuccessStateProps) {
  const [internalPreviewFile, setInternalPreviewFile] = useState<File | null>(null)
  const isNative = Capacitor.isNativePlatform()

  useEffect(() => {
    hapticSuccess()
    
    const shouldAutoDownload = localStorage.getItem('autoDownload') === 'true'
    if (shouldAutoDownload) {
      const triggerAutoDownload = async () => {
        try {
          const response = await fetch(downloadUrl)
          const blob = await response.blob()
          const buffer = await blob.arrayBuffer()
          const mimeType = fileName.endsWith('.zip') ? 'application/zip' : 'application/pdf'
          await downloadFile(new Uint8Array(buffer), fileName, mimeType)
          toast.success(`تم الحفظ التلقائي: ${fileName}`)
        } catch (e) {
          console.error('Auto-download failed:', e)
        }
      }
      triggerAutoDownload()
    }
  }, [downloadUrl, fileName])

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      toast.loading(`جارٍ الحفظ...`, { id: 'save-action' })
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()
      const mimeType = fileName.endsWith('.zip') ? 'application/zip' : 'application/pdf'
      await downloadFile(new Uint8Array(buffer), fileName, mimeType)
      toast.success(`تم الحفظ: ${fileName}`, { id: 'save-action' })
    } catch (err) {
      toast.error('فشل حفظ الملف', { id: 'save-action' })
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      toast.loading('جارٍ التحضير للمشاركة...', { id: 'share-action' })
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()
      const mimeType = fileName.endsWith('.zip') ? 'application/zip' : 'application/pdf'
      await shareFile(new Uint8Array(buffer), fileName, mimeType)
      toast.dismiss('share-action')
    } catch (err) {
      toast.error('فشل مشاركة الملف', { id: 'share-action' })
    }
  }

  const handlePreview = async () => {
    try {
      toast.loading('جارٍ تحميل المعاينة...', { id: 'preview-load' })
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      const mimeType = fileName.endsWith('.zip') ? 'application/zip' : 'application/pdf'
      const file = new File([blob], fileName, { type: mimeType })
      setInternalPreviewFile(file)
      toast.dismiss('preview-load')
    } catch (e) {
      toast.error('فشل فتح المعاينة')
    }
  }

  return (
    <div className="animate-in slide-in-from-bottom duration-500 fade-in space-y-6">
      {internalPreviewFile && (
        <PdfPreview 
          file={internalPreviewFile} 
          onClose={() => setInternalPreviewFile(null)} 
          onProcess={() => {
            const file = internalPreviewFile;
            setInternalPreviewFile(null);
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('open-quick-drop', { 
                detail: { file } 
              }))
            }, 100);
          }} 
        />
      )}

      <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 md:p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm border border-green-100 dark:border-green-900/30">
        <CheckCircle2 size={16} /> {message}
      </div>
      
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          {showPreview && (
            <button 
              onClick={handlePreview}
              className="flex-1 bg-obsidian-50 dark:bg-obsidian-900 text-obsidian-950 dark:text-white border border-obsidian-200 dark:border-obsidian-800 p-4 rounded-2xl md:rounded-3xl shadow-sm font-black text-sm md:text-xl tracking-tight transition-all hover:bg-obsidian-100 active:scale-95 flex items-center justify-center gap-2"
            >
              <Eye size={20} /> معاينة
            </button>
          )}
          
          <button 
            onClick={handleShare}
            className="flex-1 bg-ember-50 dark:bg-ember-900/20 text-ember-500 border border-ember-100 dark:border-ember-900/30 p-4 rounded-2xl md:rounded-3xl shadow-sm font-black text-sm md:text-xl tracking-tight transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Share2 size={20} /> مشاركة
          </button>
        </div>
        
        <button 
          onClick={handleDownload}
          className="w-full bg-obsidian-950 dark:bg-obsidian-50 text-white dark:text-obsidian-950 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-xl font-black text-lg md:text-xl tracking-tight transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3"
        >
          <Download size={24} /> {isNative ? 'حفظ على الجهاز' : 'تحميل'}
        </button>
      </div>

      <button 
        onClick={onStartOver}
        className="w-full mt-6 py-4 bg-obsidian-100 dark:bg-obsidian-900 text-obsidian-500 hover:text-ember-500 dark:hover:text-ember-500 rounded-2xl border border-obsidian-200 dark:border-white/5 font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
      >
        <RotateCcw size={14} /> جلسة جديدة
      </button>
    </div>
  )
}
