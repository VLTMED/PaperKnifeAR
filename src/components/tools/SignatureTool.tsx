import { useState, useRef, useEffect, useCallback } from 'react'
import { Loader2, Lock, Image as ImageIcon, ArrowRight, PenTool, Type, Trash2 } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'

import { getPdfMetaData, loadPdfDocument, renderPageThumbnail, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'

type SignatureMode = 'draw' | 'type' | 'image'
type SignaturePdfData = { file: File, pageCount: number, isLocked: boolean, pdfDoc?: any, password?: string }

const FONTS = [
  { label: 'خط أنيق', value: 'Dancing Script, cursive', import: 'Dancing+Script:wght@700' },
  { label: 'خط رسمي', value: 'Caveat, cursive', import: 'Caveat:wght@700' },
  { label: 'خط عادي', value: 'Pacifico, cursive', import: 'Pacifico' },
]

export default function SignatureTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signatureInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { consumePipelineFile } = usePipeline()

  const [pdfData, setPdfData] = useState<SignaturePdfData | null>(null)
  const [signatureImg, setSignatureImg] = useState<string | null>(null)
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [customFileName, setCustomFileName] = useState('paperknife-signed')
  const [unlockPassword, setUnlockPassword] = useState('')
  const [activePage] = useState(1)
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const [size, setSize] = useState(150)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [isDraggingSig, setIsDraggingSig] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [mode, setMode] = useState<SignatureMode>('draw')
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawing, setHasDrawing] = useState(false)
  const [typeText, setTypeText] = useState('')
  const [selectedFont, setSelectedFont] = useState(FONTS[0].value)
  const isNative = Capacitor.isNativePlatform()

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      handleFile(file)
    }
  }, [])

  // Load Google Fonts for text signatures
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Caveat:wght@700&family=Pacifico&display=swap`
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pt = getCanvasPoint(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pt.x, pt.y)
    setIsDrawing(true)
    setHasDrawing(true)
  }, [])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pt = getCanvasPoint(e, canvas)
    ctx.lineTo(pt.x, pt.y)
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }, [isDrawing])

  const stopDrawing = useCallback(() => setIsDrawing(false), [])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawing(false)
    setSignatureImg(null)
  }

  const confirmDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawing) return
    const dataUrl = canvas.toDataURL('image/png')
    setSignatureImg(dataUrl)
    // Convert dataUrl to File
    fetch(dataUrl).then(r => r.blob()).then(blob => {
      setSignatureFile(new File([blob], 'signature.png', { type: 'image/png' }))
    })
  }

  const confirmText = () => {
    if (!typeText.trim()) return
    const canvas = document.createElement('canvas')
    canvas.width = 500
    canvas.height = 150
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.font = `bold 72px ${selectedFont}`
    ctx.fillStyle = '#1a1a2e'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(typeText, 250, 75)
    const dataUrl = canvas.toDataURL('image/png')
    setSignatureImg(dataUrl)
    fetch(dataUrl).then(r => r.blob()).then(blob => {
      setSignatureFile(new File([blob], 'signature.png', { type: 'image/png' }))
    })
  }

  const handleUnlock = async () => {
    if (!pdfData || !unlockPassword) return
    setIsProcessing(true)
    try {
      const result = await unlockPdf(pdfData.file, unlockPassword)
      if (result.success) {
        setPdfData({ ...pdfData, isLocked: false, pageCount: result.pageCount, pdfDoc: result.pdfDoc, password: unlockPassword })
        const thumb = await renderPageThumbnail(result.pdfDoc, 1, 2.0)
        setThumbnail(thumb)
      } else { toast.error('كلمة المرور غير صحيحة') }
    } finally { setIsProcessing(false) }
  }

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return
    setIsProcessing(true)
    try {
      const meta = await getPdfMetaData(file)
      if (meta.isLocked) {
        setPdfData({ file, pageCount: 0, isLocked: true })
      } else {
        const pdfDoc = await loadPdfDocument(file)
        setPdfData({ file, pageCount: meta.pageCount, isLocked: false, pdfDoc })
        const thumb = await renderPageThumbnail(pdfDoc, 1, 2.0)
        setThumbnail(thumb)
      }
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!previewRef.current) return
    const rect = previewRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    if (isDraggingSig) {
      setPos({
        x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
        y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100))
      })
    } else if (isResizing) {
      const sigX = (pos.x / 100) * rect.width + rect.left
      setSize(Math.max(50, Math.min(rect.width, clientX - (sigX - (size / 2)))))
    }
  }

  const saveSignedPdf = async () => {
    if (!pdfData || !signatureFile) return
    setIsProcessing(true)
    try {
      const arrayBuffer = await pdfData.file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password: pdfData.password, ignoreEncryption: true } as any)
      const sigBytes = await signatureFile.arrayBuffer()
      const sigImage = signatureFile.type === 'image/png'
        ? await pdfDoc.embedPng(sigBytes)
        : await pdfDoc.embedJpg(sigBytes)
      const page = pdfDoc.getPages()[activePage - 1]
      const { width, height } = page.getSize()
      const pdfX = (pos.x / 100) * width
      const pdfY = height - ((pos.y / 100) * height) - (size * (sigImage.height / sigImage.width))
      page.drawImage(sigImage, { x: pdfX, y: pdfY, width: size, height: size * (sigImage.height / sigImage.width) })
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      addActivity({ name: `${customFileName}.pdf`, tool: 'Signature', size: blob.size, resultUrl: url })
    } finally { setIsProcessing(false) }
  }

  const ActionButton = () => (
    <button
      onClick={saveSignedPdf}
      disabled={isProcessing || !signatureImg}
      className={`w-full bg-ember-500 hover:bg-ember-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-ember-500/20 ${isNative ? 'py-4 rounded-2xl text-sm' : 'p-6 rounded-3xl text-xl'}`}
    >
      {isProcessing ? <Loader2 className="animate-spin" /> : <>توقيع وحفظ <ArrowRight size={18} /></>}
    </button>
  )

  const tabs: { id: SignatureMode, label: string, icon: any }[] = [
    { id: 'draw', label: 'رسم', icon: PenTool },
    { id: 'type', label: 'كتابة', icon: Type },
    { id: 'image', label: 'صورة', icon: ImageIcon },
  ]

  return (
    <NativeToolLayout title="التوقيع" description="أضف توقيعك الإلكتروني على أي مستند." actions={pdfData && !pdfData.isLocked && !downloadUrl && <ActionButton />}>
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <input type="file" accept="image/*" className="hidden" ref={signatureInputRef} onChange={(e) => {
        const file = e.target.files?.[0]
        if (file) { setSignatureFile(file); setSignatureImg(URL.createObjectURL(file)) }
      }} />

      {!pdfData ? (
        <button
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className="w-full border-4 border-dashed border-obsidian-200 dark:border-obsidian-900 rounded-[2.5rem] p-12 text-center hover:bg-ember-50 transition-all cursor-pointer group"
        >
          <ImageIcon size={32} className="mx-auto mb-4 text-ember-500" />
          <h3 className="text-xl font-bold dark:text-white">اختر ملف PDF</h3>
        </button>
      ) : pdfData.isLocked ? (
        <div className="max-w-md mx-auto p-8 bg-obsidian-50 dark:bg-obsidian-900 rounded-3xl text-center">
          <Lock size={32} className="mx-auto mb-4 text-ember-500" />
          <input type="password" value={unlockPassword} onChange={(e) => setUnlockPassword(e.target.value)} placeholder="كلمة المرور" className="w-full p-4 mb-4 border rounded-xl text-right" dir="rtl" />
          <button onClick={handleUnlock} className="w-full p-4 bg-ember-500 text-white rounded-xl font-black">فتح القفل</button>
        </div>
      ) : (
        <div className="space-y-6" onMouseMove={handleMouseMove} onTouchMove={handleMouseMove} onMouseUp={() => { setIsDraggingSig(false); setIsResizing(false) }} onTouchEnd={() => { setIsDraggingSig(false); setIsResizing(false) }}>
          {!downloadUrl ? (
            <>
              {/* Preview */}
              <div
                className="bg-obsidian-50 dark:bg-obsidian-900 p-4 rounded-3xl border border-obsidian-200 dark:border-white/5 relative aspect-[1/1.4] overflow-hidden touch-none"
                ref={previewRef}
                onClick={(e) => {
                  if (!signatureImg || isDraggingSig || isResizing) return
                  const r = e.currentTarget.getBoundingClientRect()
                  setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
                }}
              >
                {thumbnail
                  ? <img src={thumbnail} className="w-full h-full object-contain" />
                  : <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-ember-500" /></div>
                }
                {signatureImg && (
                  <div
                    onMouseDown={(e) => { e.stopPropagation(); setIsDraggingSig(true) }}
                    onTouchStart={(e) => { e.stopPropagation(); setIsDraggingSig(true) }}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${size}px`, transform: 'translate(-50%, -50%)' }}
                    className="absolute cursor-move ring-2 ring-ember-500 rounded-sm"
                  >
                    <img src={signatureImg} className="w-full pointer-events-none" />
                    <div
                      onMouseDown={(e) => { e.stopPropagation(); setIsResizing(true) }}
                      onTouchStart={(e) => { e.stopPropagation(); setIsResizing(true) }}
                      className="absolute -bottom-2 -right-2 w-6 h-6 bg-ember-500 rounded-full border-2 border-white cursor-nwse-resize"
                    />
                  </div>
                )}
                {!signatureImg && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-[10px] text-obsidian-500 font-bold bg-obsidian-50/80 dark:bg-obsidian-950/80 px-3 py-1 rounded-full">أنشئ توقيعك ثم اضغط لتحديد موضعه</p>
                  </div>
                )}
              </div>

              {/* Signature Creation Panel */}
              <div className="bg-obsidian-50 dark:bg-obsidian-900 rounded-[2rem] border border-obsidian-200 dark:border-white/5 shadow-sm overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-obsidian-200 dark:border-white/5" dir="rtl">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { setMode(tab.id); setSignatureImg(null) }}
                      className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-black transition-all ${mode === tab.id ? 'text-ember-500 border-b-2 border-ember-500' : 'text-obsidian-500'}`}
                    >
                      <tab.icon size={14} /> {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-5">
                  {mode === 'draw' && (
                    <div className="space-y-3">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={200}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-32 border-2 border-dashed border-obsidian-200 dark:border-obsidian-700 rounded-xl bg-obsidian-50 dark:bg-obsidian-800 cursor-crosshair touch-none"
                        style={{ touchAction: 'none' }}
                      />
                      <p className="text-[10px] text-obsidian-500 text-center font-medium">ارسم توقيعك هنا بإصبعك أو بالفأرة</p>
                      <div className="flex gap-3">
                        <button
                          onClick={confirmDrawing}
                          disabled={!hasDrawing}
                          className="flex-1 py-3 bg-ember-500 text-white rounded-xl text-xs font-black disabled:opacity-40"
                        >
                          تأكيد التوقيع
                        </button>
                        <button
                          onClick={clearCanvas}
                          className="py-3 px-4 bg-obsidian-100 dark:bg-obsidian-800 text-obsidian-500 rounded-xl"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {mode === 'type' && (
                    <div className="space-y-3" dir="rtl">
                      <input
                        type="text"
                        value={typeText}
                        onChange={(e) => setTypeText(e.target.value)}
                        placeholder="اكتب اسمك أو توقيعك"
                        className="w-full bg-obsidian-100 dark:bg-obsidian-800 rounded-xl px-4 py-3 border border-transparent focus:border-ember-500 outline-none font-bold text-sm dark:text-white text-right"
                        dir="rtl"
                      />
                      {typeText && (
                        <div
                          className="w-full h-20 flex items-center justify-center rounded-xl bg-obsidian-50 dark:bg-obsidian-800 border border-obsidian-200 dark:border-obsidian-700"
                          style={{ fontFamily: selectedFont, fontSize: '2rem', color: '#1a1a2e' }}
                        >
                          {typeText}
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        {FONTS.map(font => (
                          <button
                            key={font.value}
                            onClick={() => setSelectedFont(font.value)}
                            className={`py-2 px-3 rounded-xl text-xs border transition-all ${selectedFont === font.value ? 'border-ember-500 bg-ember-50 dark:bg-ember-900/20 text-ember-500' : 'border-obsidian-200 dark:border-obsidian-700 text-obsidian-500'}`}
                            style={{ fontFamily: font.value }}
                          >
                            {font.label}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={confirmText}
                        disabled={!typeText.trim()}
                        className="w-full py-3 bg-ember-500 text-white rounded-xl text-xs font-black disabled:opacity-40"
                      >
                        تأكيد التوقيع
                      </button>
                    </div>
                  )}

                  {mode === 'image' && (
                    <div className="space-y-3">
                      <button
                        onClick={() => signatureInputRef.current?.click()}
                        className="w-full p-4 border-2 border-dashed border-obsidian-200 dark:border-obsidian-700 rounded-xl text-obsidian-500 flex items-center justify-center gap-2 hover:border-ember-500 hover:text-ember-500 transition-all"
                      >
                        <ImageIcon size={16} /> رفع صورة التوقيع
                      </button>
                      <p className="text-[10px] text-obsidian-500 text-center">يدعم PNG وJPG — خلفية شفافة للأفضل</p>
                    </div>
                  )}

                  {signatureImg && mode !== 'draw' && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30 flex items-center gap-2">
                      <img src={signatureImg} className="h-10 object-contain" />
                      <span className="text-xs text-green-600 dark:text-green-400 font-bold flex-1 text-right">التوقيع جاهز — اضغط على الصفحة لتحديد الموضع</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Output filename */}
              <div className="bg-obsidian-50 dark:bg-obsidian-900 p-6 rounded-[2rem] border border-obsidian-200 dark:border-white/5 shadow-sm" dir="rtl">
                <label className="block text-[10px] font-black uppercase tracking-widest text-obsidian-500 mb-3 px-1">اسم الملف الناتج</label>
                <input
                  type="text"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  className="w-full bg-obsidian-100 dark:bg-obsidian-950 rounded-xl px-4 py-3 border border-transparent focus:border-ember-500 outline-none font-bold text-sm dark:text-white text-right"
                  dir="ltr"
                />
              </div>
            </>
          ) : (
            <SuccessState message="تم التوقيع بنجاح!" downloadUrl={downloadUrl} fileName={`${customFileName}.pdf`} onStartOver={() => { setDownloadUrl(null); setPdfData(null); setSignatureImg(null); setHasDrawing(false) }} />
          )}
          <button onClick={() => { setPdfData(null); setSignatureImg(null); setHasDrawing(false) }} className="w-full py-2 text-[10px] font-black uppercase text-obsidian-400 hover:text-ember-500 transition-colors">إغلاق الملف</button>
        </div>
      )}
      <PrivacyBadge />
    </NativeToolLayout>
  )
}
