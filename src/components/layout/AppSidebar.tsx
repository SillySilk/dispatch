import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Home,
  Users,
  UserCog,
  Calendar,
  MessageSquare,
  HeartPulse,
  Settings,
  Shield,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const mainNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/houses', icon: Home, label: 'Houses' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/staff', icon: UserCog, label: 'Staff' },
  { to: '/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/messaging', icon: MessageSquare, label: 'Messaging' },
  { to: '/on-call', icon: HeartPulse, label: 'On-Call' },
]

const settingsNavItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function AppSidebar() {
  return (
    <aside className="w-64 flex flex-col h-screen sticky top-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/50">
      {/* App Logo & Branding */}
      <div className="p-6 pb-8">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
            <div className="relative bg-gradient-to-br from-indigo-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/25">
              <Shield className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              AbleLight
            </h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              Dispatch &amp; Scheduling Beta
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {mainNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/20 to-indigo-500/10 text-white shadow-lg shadow-indigo-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-400 to-indigo-500 rounded-r-full shadow-lg shadow-indigo-500/50" />
                )}
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-all duration-200',
                    isActive
                      ? 'text-indigo-400'
                      : 'text-slate-500 group-hover:text-slate-300'
                  )}
                  strokeWidth={2}
                />
                <span className="font-medium">{item.label}</span>
                {!isActive && (
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="py-3">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
        </div>

        {settingsNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/20 to-indigo-500/10 text-white shadow-lg shadow-indigo-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-400 to-indigo-500 rounded-r-full shadow-lg shadow-indigo-500/50" />
                )}
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-all duration-200',
                    isActive
                      ? 'text-indigo-400'
                      : 'text-slate-500 group-hover:text-slate-300'
                  )}
                  strokeWidth={2}
                />
                <span className="font-medium">{item.label}</span>
                {!isActive && (
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-800/50">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 cursor-pointer group">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-shadow duration-200">
              <span className="text-sm font-bold text-white">DC</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              AbleLight Dispatch
            </p>
            <p className="text-xs text-slate-400">
              Active Session
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
