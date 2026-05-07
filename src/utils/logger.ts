type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogContext = Record<string, unknown>

type LogEntry = {
  level: LogLevel
  event: string
  context?: LogContext
  timestamp: string
}

const levelRank: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const defaultLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'warn'
let activeLevel: LogLevel = defaultLevel
const queue: LogEntry[] = []
let flushScheduled = false

const sensitivePatterns = [
  /data:[^\s,)]+/gi,
  /blob:[^\s,)]+/gi,
  /[A-Za-z]:\\[^\s,)]+/g,
  /\/(?:[^\s/)]+\/)+[^\s,)]+/g,
]

const sanitizeString = (value: string) => {
  return sensitivePatterns.reduce((safe, pattern) => safe.replace(pattern, '[redacted]'), value).slice(0, 300)
}

const sanitizeValue = (value: unknown): unknown => {
  if (value instanceof Error) {
    return {
      name: sanitizeString(value.name),
      message: sanitizeString(value.message),
    }
  }

  if (typeof value === 'string') return sanitizeString(value)
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value
  if (Array.isArray(value)) return value.slice(0, 5).map(sanitizeValue)

  if (typeof value === 'object' && value) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !/password|base64|blob|url|path|text|metadata|filename|name/i.test(key))
        .slice(0, 10)
        .map(([key, item]) => [key, sanitizeValue(item)]),
    )
  }

  return undefined
}

const sanitizeContext = (context?: LogContext): LogContext | undefined => {
  if (!context) return undefined
  const safe = sanitizeValue(context)
  return typeof safe === 'object' && safe && !Array.isArray(safe) ? safe as LogContext : undefined
}

const shouldLog = (level: LogLevel) => levelRank[level] >= levelRank[activeLevel]

const flush = () => {
  flushScheduled = false
  const entries = queue.splice(0, queue.length)

  for (const entry of entries) {
    try {
      const payload = entry.context ? [entry.event, entry.context] : [entry.event]
      if (entry.level === 'debug') console.debug(...payload)
      else if (entry.level === 'info') console.info(...payload)
      else if (entry.level === 'warn') console.warn(...payload)
      else console.error(...payload)
    } catch {
      // Logging must never interrupt PDF processing or rendering.
    }
  }
}

const scheduleFlush = () => {
  if (flushScheduled) return
  flushScheduled = true
  queueMicrotask(flush)
}

const write = (level: LogLevel, event: string, context?: LogContext) => {
  if (!shouldLog(level)) return
  queue.push({
    level,
    event: sanitizeString(event),
    context: sanitizeContext(context),
    timestamp: new Date().toISOString(),
  })
  scheduleFlush()
}

export const logger = {
  setLevel(level: LogLevel) {
    activeLevel = level
  },
  debug(event: string, context?: LogContext) {
    write('debug', event, context)
  },
  info(event: string, context?: LogContext) {
    write('info', event, context)
  },
  warn(event: string, context?: LogContext) {
    write('warn', event, context)
  },
  error(event: string, context?: LogContext) {
    write('error', event, context)
  },
}
