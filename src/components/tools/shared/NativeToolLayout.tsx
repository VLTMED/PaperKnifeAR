import React from 'react'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import ToolHeader from './ToolHeader'

interface NativeToolLayoutProps {
  title: string
  description: string
  children: React.ReactNode
  actions?: React.ReactNode
  onBack?: () => void
}

export const NativeToolLayout = ({ 
  title, 
  description, 
  children, 
  actions,
  onBack 
}: NativeToolLayoutProps) => {
  const navigate = useNavigate()
  const isNative = Capacitor.isNativePlatform()
  const showNativeHeader = isNative || document.body.classList.contains('android-mode')

  return (
    <div dir={showNativeHeader ? 'rtl' : undefined} className="flex flex-col min-h-screen bg-[#FAFAFA] dark:bg-obsidian-950 transition-colors">
      {showNativeHeader && (
        <header className="px-4 pt-safe pb-1 flex items-center justify-between sticky top-0 z-30 bg-[#FAFAFA]/95 dark:bg-obsidian-950/95 backdrop-blur-xl md:hidden border-b border-obsidian-200 dark:border-white/5">
          <div className="w-10" />
          <div className="flex items-center gap-2 h-14">
            <h1 className="text-lg font-black tracking-tight text-obsidian-950 dark:text-white ml-1 font-display-ar">{title}</h1>
            <button 
              onClick={onBack || (() => navigate(-1))}
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-obsidian-100 dark:active:bg-obsidian-900 transition-colors"
            >
              <ArrowRight size={24} className="text-obsidian-950 dark:text-white" />
            </button>
          </div>
        </header>
      )}

      <main className={`flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full ${actions ? 'pb-32 md:pb-8' : ''}`}>
        <div className={`${showNativeHeader ? 'hidden md:block' : 'block'} mb-8`}>
           <ToolHeader title={title} description={description} />
        </div>

        <div className="flex-1">
          {children}
        </div>
      </main>

      {actions && (
        <div className="fixed bottom-0 left-0 right-0 bg-obsidian-50/95 dark:bg-obsidian-950/95 backdrop-blur-xl border-t border-obsidian-200 dark:border-white/5 z-40 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
           <div className="p-4 max-w-md mx-auto">
             {actions}
           </div>
        </div>
      )}
    </div>
  )
}
