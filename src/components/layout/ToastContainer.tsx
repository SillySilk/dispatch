import { cn } from '../../lib/utils'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-white shadow-xl animate-slide-up',
            t.type === 'success'
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-500/20'
              : 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/20'
          )}
        >
          {t.type === 'success' ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <XCircle className="h-4 w-4 flex-shrink-0" />}
          {t.message}
        </div>
      ))}
    </div>
  )
}
