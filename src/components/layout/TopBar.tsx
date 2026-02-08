interface TopBarProps {
  title: string
  children?: React.ReactNode
}

export function TopBar({ title, children }: TopBarProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-gradient-to-r from-white via-slate-50/50 to-white backdrop-blur-xl shadow-sm">
      <div className="px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent truncate">
            {title}
          </h2>
          {children && (
            <div className="hidden sm:block ml-4 h-8 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent flex-shrink-0" />
          )}
        </div>
        {children && (
          <div className="flex items-center gap-3 ml-4 flex-shrink-0">
            {children}
          </div>
        )}
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
    </div>
  )
}
