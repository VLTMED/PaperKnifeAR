import { useState, useRef, useEffect, useCallback } from 'react'
import { Loader2, Lock, Image as ImageIcon, ArrowRight, PenLine, Type, Trash2, Copy, X, Check } from 'lucide-react'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'

import { getPdfMetaData, loadPdfDocument, renderPageThumbnail, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'

type ElementType = 'signature' | 'text'

interface AnnotationElement {
  id: string
  type: ElementType
  x: number
  y: number
  widthFrac: number
  dataUrl?: string
  text?: string
  fontSize?: number
  color?: string
}

type PdfData = {
  file: File
  pageCount: number
  isLocked: boolean
  pdfDoc?: any
  password?: string
  pageWidth?: number
  pageHeight?: number
}

const uid = () => Math.random().toString(36).slice(2, 9)

function DrawModal({ onDone, onClose }: { onDone: (d: string) => void; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPt = useRef<{ x: number; y: number } | null>(null)
  const [hasStrokes, setHasStrokes] = useState(false)

  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    const sx = c.width / r.width
    const sy = c.height / r.height
    if ('touches' in e) return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy }
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy }
  }

  const onStart = (e: React.MouseEvent | React.TouchEvent) => { e.preventDefault(); isDrawing.current = true; lastPt.current = getPoint(e) }
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing.current || !lastPt.current || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')!
    const pt = getPoint(e)
    ctx.beginPath(); ctx.moveTo(lastPt.current.x, lastPt.current.y); ctx.lineTo(pt.x, pt.y); ctx.stroke()
    lastPt.current = pt; setHasStrokes(true)
  }
  const onEnd = () => { isDrawing.current = false; lastPt.current = null }
  const clear = () => { canvasRef.current!.getContext('2d')!.clearRect(0,0,9999,9999); setHasStrokes(false) }
  const done = () => onDone(canvasRef.current!.toDataURL('image/png'))

  useEffect(() => {
    const c = canvasRef.current!
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr
    const ctx = c.getContext('2d')!
    ctx.scale(dpr, dpr); ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5">
          <span className="text-sm font-black uppercase tracking-widest text-gray-500">Draw Signature</span>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl"><X size={16}/></button>
        </div>
        <canvas ref={canvasRef} style={{ width:'100%', height:200, touchAction:'none', cursor:'crosshair', display:'block', background:'#fafafa' }}
          onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
          onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd} />
        <div className="flex gap-3 p-4 border-t border-gray-100 dark:border-white/5">
          <button onClick={clear} className="flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border border-gray-200 dark:border-white/10 hover:border-rose-500 transition-colors dark:text-white">Clear</button>
          <button onClick={done} disabled={!hasStrokes} className="flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-rose-500 text-white disabled:opacity-40 flex items-center justify-center gap-2">
            <Check size={14}/> Use
          </button>
        </div>
      </div>
    </div>
  )
}

function TextModal({ onDone, onClose }: { onDone: (t:string, f:number, c:string)=>void; onClose:()=>void }) {
  const [text, setText] = useState('')
  const [fontSize, setFontSize] = useState(24)
  const [color, setColor] = useState('#000000')
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-black uppercase tracking-widest text-gray-500">Add Text</span>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl"><X size={16}/></button>
        </div>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Enter text..." rows={3}
          className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white resize-none" autoFocus />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Size ({fontSize}pt)</label>
            <input type="range" min={8} max={72} value={fontSize} onChange={e=>setFontSize(+e.target.value)} className="w-full accent-rose-500"/>
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {['#000000','#F43F5E','#3B82F6','#10B981'].map(c=>(
                <button key={c} onClick={()=>setColor(c)} className={`w-7 h-7 rounded-full border-2 transition-all ${color===c?'border-zinc-900 dark:border-white scale-110':'border-transparent'}`} style={{backgroundColor:c}}/>
              ))}
              <input type="color" value={color} onChange={e=>setColor(e.target.value)} className="w-7 h-7 rounded-full overflow-hidden border-none p-0 cursor-pointer bg-transparent"/>
            </div>
          </div>
        </div>
        <button onClick={()=>text.trim()&&onDone(text.trim(),fontSize,color)} disabled={!text.trim()}
          className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-rose-500 text-white disabled:opacity-40 flex items-center justify-center gap-2">
          <Check size={14}/> Add Text
        </button>
      </div>
    </div>
  )
}

export default function SignatureTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sigImgInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const { consumePipelineFile } = usePipeline()
  const isNative = Capacitor.isNativePlatform()

  const [pdfData, setPdfData] = useState<PdfData | null>(null)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [elements, setElements] = useState<AnnotationElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragging, setDragging] = useState<{id:string;startFx:number;startFy:number;startCX:number;startCY:number}|null>(null)
  const [resizing, setResizing] = useState<{id:string;startW:number;startCX:number}|null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [customFileName, setCustomFileName] = useState('paperknife-signed')
  const [unlockPassword, setUnlockPassword] = useState('')
  const [showDrawModal, setShowDrawModal] = useState(false)
  const [showTextModal, setShowTextModal] = useState(false)

  useEffect(() => {
    const p = consumePipelineFile()
    if (p) handleFile(new File([p.buffer as any], p.name, { type: 'application/pdf' }))
  }, [])

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return
    setIsProcessing(true)
    try {
      const meta = await getPdfMetaData(file)
      if (meta.isLocked) {
        setPdfData({ file, pageCount: 0, isLocked: true })
      } else {
        const pdfDoc = await loadPdfDocument(file)
        const page = await pdfDoc.getPage(1)
        const vp = page.getViewport({ scale: 1 })
        setPdfData({ file, pageCount: meta.pageCount, isLocked: false, pdfDoc, pageWidth: vp.width, pageHeight: vp.height })
        setThumbnail(await renderPageThumbnail(pdfDoc, 1, 2.0))
        setCustomFileName(file.name.replace('.pdf', '') + '-signed')
      }
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleUnlock = async () => {
    if (!pdfData || !unlockPassword) return
    setIsProcessing(true)
    try {
      const result = await unlockPdf(pdfData.file, unlockPassword)
      if (result.success) {
        const page = await result.pdfDoc.getPage(1)
        const vp = page.getViewport({ scale: 1 })
        setPdfData({ ...pdfData, isLocked: false, pageCount: result.pageCount, pdfDoc: result.pdfDoc, password: unlockPassword, pageWidth: vp.width, pageHeight: vp.height })
        setThumbnail(result.thumbnail)
      } else toast.error('Incorrect password')
    } finally { setIsProcessing(false) }
  }

  const getClient = (e: React.MouseEvent | React.TouchEvent) =>
    'touches' in e ? { cx: e.touches[0].clientX, cy: e.touches[0].clientY } : { cx: e.clientX, cy: e.clientY }

  const onPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent, id: string, mode: 'drag'|'resize') => {
    e.preventDefault(); e.stopPropagation()
    const { cx, cy } = getClient(e)
    const el = elements.find(x => x.id === id)!
    setSelectedId(id)
    if (mode === 'drag') setDragging({ id, startFx: el.x, startFy: el.y, startCX: cx, startCY: cy })
    else setResizing({ id, startW: el.widthFrac, startCX: cx })
  }, [elements])

  const onPointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!previewRef.current || !pdfData?.pageWidth || !pdfData?.pageHeight) return
    const { cx, cy } = getClient(e)
    // Container uses object-fill so 100% = page — direct mapping
    const cw = previewRef.current.clientWidth
    const ch = previewRef.current.clientHeight
    if (dragging) {
      const dfx = (cx - dragging.startCX) / cw
      const dfy = (cy - dragging.startCY) / ch
      setElements(prev => prev.map(el => el.id === dragging.id
        ? { ...el, x: Math.max(0, Math.min(0.95, dragging.startFx + dfx)), y: Math.max(0, Math.min(0.95, dragging.startFy + dfy)) }
        : el))
    } else if (resizing) {
      const dw = (cx - resizing.startCX) / cw
      setElements(prev => prev.map(el => el.id === resizing.id
        ? { ...el, widthFrac: Math.max(0.05, Math.min(0.95, resizing.startW + dw)) }
        : el))
    }
  }, [dragging, resizing, pdfData])

  const onPointerUp = useCallback(() => { setDragging(null); setResizing(null) }, [])

  const addSignatureFromUrl = (dataUrl: string) => {
    setElements(prev => [...prev, { id: uid(), type: 'signature', x: 0.05, y: 0.7, widthFrac: 0.3, dataUrl }])
    setShowDrawModal(false)
  }

  const addSignatureFromFile = (file: File) => {
    const url = URL.createObjectURL(file)
    setElements(prev => [...prev, { id: uid(), type: 'signature', x: 0.05, y: 0.7, widthFrac: 0.3, dataUrl: url }])
  }

  const addText = (text: string, fontSize: number, color: string) => {
    setElements(prev => [...prev, { id: uid(), type: 'text', x: 0.05, y: 0.5, widthFrac: 0.5, text, fontSize, color }])
    setShowTextModal(false)
  }

  const deleteElement = (id: string) => { setElements(prev => prev.filter(el => el.id !== id)); if (selectedId === id) setSelectedId(null) }
  const duplicateElement = (id: string) => {
    const el = elements.find(x => x.id === id); if (!el) return
    setElements(prev => [...prev, { ...el, id: uid(), x: Math.min(0.9, el.x + 0.03), y: Math.min(0.9, el.y + 0.03) }])
  }

  const save = async () => {
    if (!pdfData || elements.length === 0) return
    setIsProcessing(true)
    try {
      const doc = await PDFDocument.load(await pdfData.file.arrayBuffer(), { password: pdfData.password, ignoreEncryption: true } as any)
      const page = doc.getPages()[0]
      const { width: pW, height: pH } = page.getSize()

      for (const el of elements) {
        if (el.type === 'signature' && el.dataUrl) {
          const bytes = await (await fetch(el.dataUrl)).arrayBuffer()
          const isPng = el.dataUrl.startsWith('data:image/png') || el.dataUrl.includes('/png')
          const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes)
          const elW = el.widthFrac * pW
          const elH = elW * (img.height / img.width)
          page.drawImage(img, { x: el.x * pW, y: pH - el.y * pH - elH, width: elW, height: elH })
        } else if (el.type === 'text' && el.text) {
          const font = await doc.embedFont(StandardFonts.Helvetica)
          const hex = el.color ?? '#000000'
          page.drawText(el.text, {
            x: el.x * pW,
            y: pH - el.y * pH - (el.fontSize ?? 24),
            size: el.fontSize ?? 24,
            font,
            color: rgb(parseInt(hex.slice(1,3),16)/255, parseInt(hex.slice(3,5),16)/255, parseInt(hex.slice(5,7),16)/255)
          })
        }
      }

      const blob = new Blob([await doc.save() as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      addActivity({ name: `${customFileName}.pdf`, tool: 'Signature', size: blob.size, resultUrl: url })
    } catch (err: any) { toast.error(`Error: ${err.message}`) }
    finally { setIsProcessing(false) }
  }

  const pageAspect = pdfData?.pageWidth && pdfData?.pageHeight ? pdfData.pageWidth / pdfData.pageHeight : 1 / 1.4

  const ActionButton = () => (
    <button onClick={save} disabled={isProcessing || elements.length === 0}
      className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-rose-500/20 ${isNative ? 'py-4 rounded-2xl text-sm' : 'p-6 rounded-3xl text-xl'}`}>
      {isProcessing ? <Loader2 className="animate-spin"/> : <>Sign & Save <ArrowRight size={18}/></>}
    </button>
  )

  return (
    <NativeToolLayout title="Signature" description="Sign PDFs with pixel-perfect placement." actions={pdfData && !pdfData.isLocked && !downloadUrl && elements.length > 0 && <ActionButton/>}>
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={e=>e.target.files?.[0]&&handleFile(e.target.files[0])}/>
      <input type="file" accept="image/*" className="hidden" ref={sigImgInputRef} onChange={e=>{const f=e.target.files?.[0];if(f)addSignatureFromFile(f);if(sigImgInputRef.current)sigImgInputRef.current.value=''}}/>

      {showDrawModal && <DrawModal onDone={addSignatureFromUrl} onClose={()=>setShowDrawModal(false)}/>}
      {showTextModal && <TextModal onDone={addText} onClose={()=>setShowTextModal(false)}/>}

      {!pdfData ? (
        <button onClick={()=>!isProcessing&&fileInputRef.current?.click()}
          className="w-full border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer">
          <ImageIcon size={32} className="mx-auto mb-4 text-rose-500"/>
          <h3 className="text-xl font-bold dark:text-white">Select PDF</h3>
        </button>
      ) : pdfData.isLocked ? (
        <div className="max-w-md mx-auto p-8 bg-white dark:bg-zinc-900 rounded-3xl text-center">
          <Lock size={32} className="mx-auto mb-4 text-rose-500"/>
          <input type="password" value={unlockPassword} onChange={e=>setUnlockPassword(e.target.value)} placeholder="Password"
            className="w-full p-4 mb-4 border rounded-xl dark:bg-black dark:text-white outline-none focus:border-rose-500"/>
          <button onClick={handleUnlock} disabled={!unlockPassword||isProcessing} className="w-full p-4 bg-rose-500 text-white rounded-xl font-black disabled:opacity-50">Unlock</button>
        </div>
      ) : downloadUrl ? (
        <SuccessState message="Signed Successfully!" downloadUrl={downloadUrl} fileName={`${customFileName}.pdf`}
          onStartOver={()=>{setDownloadUrl(null);setPdfData(null);setThumbnail(null);setElements([])}}/>
      ) : (
        <div className="space-y-5">
          {/* Preview */}
          <div className="bg-white dark:bg-zinc-900 p-3 rounded-3xl border border-gray-100 dark:border-white/5">
            <div ref={previewRef}
              className="relative overflow-visible rounded-2xl select-none touch-none mx-auto"
              style={{ aspectRatio: String(pageAspect), maxHeight: '65vh', overflow: 'visible' }}
              onMouseMove={onPointerMove} onTouchMove={onPointerMove}
              onMouseUp={onPointerUp} onTouchEnd={onPointerUp} onMouseLeave={onPointerUp}
              onClick={()=>setSelectedId(null)}>
              <div className="relative w-full h-full overflow-hidden rounded-2xl">
                {thumbnail
                  ? <img src={thumbnail} className="w-full h-full block" style={{objectFit:'fill'}} draggable={false}/>
                  : <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-zinc-800"><Loader2 className="animate-spin text-rose-500"/></div>
                }
                {elements.map((el) => {
                  const isSelected = selectedId === el.id
                  return (
                    <div key={el.id}
                      onMouseDown={e=>{e.stopPropagation();onPointerDown(e,el.id,'drag')}}
                      onTouchStart={e=>{e.stopPropagation();onPointerDown(e,el.id,'drag')}}
                      style={{ position:'absolute', left:`${el.x*100}%`, top:`${el.y*100}%`, width:`${el.widthFrac*100}%`, cursor:'move' }}
                      className={`${isSelected?'ring-2 ring-rose-500':'ring-1 ring-transparent hover:ring-rose-300'} rounded-sm`}>
                      {el.type==='signature'&&el.dataUrl&&<img src={el.dataUrl} className="w-full pointer-events-none block" draggable={false}/>}
                      {el.type==='text'&&<span className="pointer-events-none whitespace-pre-wrap break-words font-bold leading-tight block" style={{color:el.color,fontSize:`${(el.fontSize??24)*(el.widthFrac)}px`}}>{el.text}</span>}
                      <div onMouseDown={e=>{e.stopPropagation();onPointerDown(e,el.id,'resize')}} onTouchStart={e=>{e.stopPropagation();onPointerDown(e,el.id,'resize')}}
                        className="absolute -bottom-2 -right-2 w-5 h-5 bg-rose-500 rounded-full border-2 border-white cursor-nwse-resize shadow"/>
                      {isSelected&&(
                        <div className="absolute -top-8 left-0 flex gap-1" onMouseDown={e=>e.stopPropagation()}>
                          <button onClick={e=>{e.stopPropagation();duplicateElement(el.id)}} className="w-7 h-7 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg flex items-center justify-center shadow hover:border-rose-500"><Copy size={12}/></button>
                          <button onClick={e=>{e.stopPropagation();deleteElement(el.id)}} className="w-7 h-7 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg flex items-center justify-center shadow hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-colors"><Trash2 size={12}/></button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Add buttons */}
          <div className="grid grid-cols-3 gap-3">
            {[{icon:<PenLine size={20} className="text-rose-500"/>,label:'Draw',action:()=>setShowDrawModal(true)},
              {icon:<ImageIcon size={20} className="text-rose-500"/>,label:'Image',action:()=>sigImgInputRef.current?.click()},
              {icon:<Type size={20} className="text-rose-500"/>,label:'Text',action:()=>setShowTextModal(true)}
            ].map(({icon,label,action})=>(
              <button key={label} onClick={action} className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-2xl hover:border-rose-500 transition-all">
                {icon}<span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</span>
              </button>
            ))}
          </div>

          {/* Elements list */}
          {elements.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
              {elements.map((el,i)=>(
                <div key={el.id} onClick={()=>setSelectedId(el.id)}
                  className={`flex items-center gap-3 px-4 py-3 border-b last:border-0 border-gray-50 dark:border-white/5 cursor-pointer ${selectedId===el.id?'bg-rose-50 dark:bg-rose-900/10':'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                  <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                    {el.type==='signature'?<PenLine size={14} className="text-rose-500"/>:<Type size={14} className="text-rose-500"/>}
                  </div>
                  <span className="flex-1 text-xs font-bold dark:text-white truncate">{el.type==='text'?el.text:`Signature ${i+1}`}</span>
                  <button onClick={e=>{e.stopPropagation();duplicateElement(el.id)}} className="p-1.5 hover:text-rose-500 text-gray-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"><Copy size={13}/></button>
                  <button onClick={e=>{e.stopPropagation();deleteElement(el.id)}} className="p-1.5 hover:text-rose-500 text-gray-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"><Trash2 size={13}/></button>
                </div>
              ))}
            </div>
          )}

          {/* Filename */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-white/5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Output Filename</label>
            <input type="text" value={customFileName} onChange={e=>setCustomFileName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white"/>
          </div>

          {elements.length > 0 && <ActionButton/>}
          <button onClick={()=>{setPdfData(null);setThumbnail(null);setElements([])}} className="w-full py-2 text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors">Close File</button>
        </div>
      )}
      <PrivacyBadge/>
    </NativeToolLayout>
  )
}
