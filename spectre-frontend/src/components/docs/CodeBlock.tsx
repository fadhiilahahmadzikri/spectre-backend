import { useState, useEffect, useRef } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { codeToHtml } from 'shiki'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
  className?: string
}

// Language aliases agar nama mudah diingat
const LANG_MAP: Record<string, string> = {
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  tsx: 'tsx',
  ts: 'typescript',
  typescript: 'typescript',
  js: 'javascript',
  javascript: 'javascript',
  json: 'json',
  html: 'html',
  css: 'css',
  python: 'python',
  py: 'python',
  http: 'http',
}

const LANG_LABEL: Record<string, string> = {
  bash: 'bash',
  tsx: 'tsx',
  typescript: 'ts',
  javascript: 'js',
  json: 'json',
  html: 'html',
  css: 'css',
  python: 'python',
  http: 'http',
}

export default function CodeBlock({ code, language = 'bash', filename, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [html, setHtml] = useState<string | null>(null)
  const cacheRef = useRef<Map<string, string>>(new Map())

  const lang = LANG_MAP[language] ?? 'bash'
  const cacheKey = `${lang}::${code}`

  useEffect(() => {
    if (cacheRef.current.has(cacheKey)) {
      setHtml(cacheRef.current.get(cacheKey)!)
      return
    }
    let cancelled = false
    codeToHtml(code, {
      lang,
      theme: 'dark-plus',
    }).then((result) => {
      if (!cancelled) {
        cacheRef.current.set(cacheKey, result)
        setHtml(result)
      }
    }).catch(() => {
      // fallback: render plain
      if (!cancelled) setHtml('')
    })
    return () => { cancelled = true }
  }, [cacheKey, code, lang])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const label = filename ?? LANG_LABEL[lang] ?? language

  return (
    <div className={cn('rounded-xl border border-white/8 shadow-lg', className)}>
      {/* Tab bar seperti VS Code */}
      <div className="flex items-center justify-between bg-[#1e1e1e] border-b border-white/8 px-0 py-0 min-h-[38px]">
        <div className="flex items-end h-full">
          {/* Active tab */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#1e1e1e] border-t-2 border-t-[#007acc] border-r border-r-white/8 text-[#cccccc]">
            <FileIcon lang={lang} />
            <span className="text-[12px] font-mono text-[#cccccc]">{label}</span>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-[#858585] hover:text-[#cccccc] transition-colors px-3 py-1.5 mx-2 rounded hover:bg-white/8"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#4ec9b0]" />
              <span className="text-[#4ec9b0]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code area */}
      {html !== null && html !== '' ? (
        <div
          className="overflow-x-auto bg-[#1e1e1e] text-[13px] leading-[1.6] [&>pre]:!bg-transparent [&>pre]:!m-0 [&>pre]:p-4 [&>pre]:min-w-full [&>pre]:font-['JetBrains_Mono_Variable',monospace]"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        /* Fallback plain text saat shiki belum selesai load */
        <pre className="bg-[#1e1e1e] text-[#d4d4d4] font-['JetBrains_Mono_Variable',monospace] text-[13px] leading-[1.6] p-4 overflow-x-auto m-0">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}

function FileIcon({ lang }: { lang: string }) {
  // Warna ikon sesuai VS Code
  const iconMap: Record<string, { icon: string; color: string }> = {
    typescript: { icon: 'TS', color: '#3178c6' },
    tsx:        { icon: 'TSX', color: '#3178c6' },
    javascript: { icon: 'JS', color: '#f7df1e' },
    json:       { icon: '{}', color: '#cbcb41' },
    bash:       { icon: '$_', color: '#89d185' },
    html:       { icon: '<>', color: '#e34c26' },
    css:        { icon: '#', color: '#563d7c' },
    python:     { icon: 'PY', color: '#3572a5' },
    http:       { icon: '↕', color: '#6a9153' },
  }
  const { icon, color } = iconMap[lang] ?? { icon: '•', color: '#858585' }
  return (
    <span
      className="text-[10px] font-bold font-mono leading-none px-1 py-0.5 rounded-sm"
      style={{ color, backgroundColor: `${color}22` }}
    >
      {icon}
    </span>
  )
}
