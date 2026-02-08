import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Calendar, AlertTriangle, Users, Home, Plus, Clock, ArrowRight, MapPin, HeartPulse, Phone, MessageSquare } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { TopBar } from '../layout/TopBar'
import { useApi } from '../../hooks/useApi'

const avatarGradients = [
  'gradient-indigo', 'gradient-emerald', 'gradient-violet',
  'gradient-amber', 'gradient-rose', 'gradient-sky',
]

export function Dashboard() {
  const navigate = useNavigate()
  const { data: stats, loading } = useApi(() => window.api.dashboard.stats())
  const { data: houses } = useApi(() => window.api.houses.list())
  const { data: staffList } = useApi(() => window.api.staff.list())
  const { data: clients } = useApi(() => window.api.clients.list())
  const { data: onCallNurses } = useApi(() => window.api.oncall.getCurrentAll())

  const todayAppts = stats?.todayAppointments || []
  const unassigned = stats?.unassigned || []
  const failedReminders = stats?.failedReminders || []
  const alerts = unassigned.length + failedReminders.length

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Dashboard">
        <Button
          onClick={() => navigate('/appointments')}
          className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-md shadow-indigo-500/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </TopBar>

      <div className="p-6 space-y-6 bg-grid-pattern min-h-full">
        {/* Welcome */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            {greeting()}
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
            {todayAppts.length > 0 && ` \u2022 ${todayAppts.length} appointment${todayAppts.length > 1 ? 's' : ''} today`}
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { icon: Calendar, value: todayAppts.length, label: "Today's Appointments", gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20', link: '/appointments' },
            { icon: Home, value: houses?.length || 0, label: 'Active Houses', gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20', link: '/houses' },
            { icon: Users, value: clients?.length || 0, label: 'Active Clients', gradient: 'from-violet-500 to-violet-600', shadow: 'shadow-violet-500/20', link: '/clients' },
            { icon: AlertTriangle, value: alerts, label: 'Alerts', gradient: alerts > 0 ? 'from-amber-500 to-amber-600' : 'from-slate-400 to-slate-500', shadow: alerts > 0 ? 'shadow-amber-500/20' : 'shadow-slate-400/10', link: null },
          ].map((stat, i) => (
            <Card
              key={i}
              className={`card-hover overflow-hidden animate-slide-up ${stat.link ? 'cursor-pointer' : ''}`}
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
              onClick={stat.link ? () => navigate(stat.link!) : undefined}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow} flex-shrink-0`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                </div>
                {stat.link && (
                  <div className="mt-3 pt-3 border-t flex items-center text-xs text-muted-foreground hover:text-indigo-600 transition-colors">
                    View all <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Today's Appointments - Timeline */}
          <Card className="animate-slide-up" style={{ animationDelay: '320ms', animationFillMode: 'backwards' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="w-8 h-8 rounded-lg gradient-indigo flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : !todayAppts.length ? (
                <div className="py-8 text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No appointments today.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {todayAppts.map((a, i) => (
                    <div key={a.id} className="flex gap-4 group">
                      {/* Time column */}
                      <div className="flex flex-col items-center w-16 flex-shrink-0">
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                          {format(parseISO(a.start_datetime), 'h:mm a')}
                        </span>
                        {i < todayAppts.length - 1 && (
                          <div className="w-px h-full bg-gradient-to-b from-indigo-200 to-transparent min-h-[24px] mt-1" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 pb-4 border-b border-dashed last:border-0 last:pb-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{a.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {a.client_name && <span>{a.client_name}</span>}
                              {a.staff_name && (
                                <span className="flex items-center gap-1">
                                  <span className="w-4 h-4 rounded-full gradient-violet inline-flex items-center justify-center text-[8px] font-bold text-white">
                                    {a.staff_name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                  {a.staff_name}
                                </span>
                              )}
                            </div>
                            {a.location && (
                              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {a.location}
                              </p>
                            )}
                          </div>
                          <Badge variant={a.status === 'scheduled' ? 'default' : 'secondary'} className="text-xs ml-2">
                            {a.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className={`w-8 h-8 rounded-lg ${alerts > 0 ? 'gradient-amber' : 'bg-slate-100'} flex items-center justify-center`}>
                  <AlertTriangle className={`h-4 w-4 ${alerts > 0 ? 'text-white' : 'text-slate-400'}`} />
                </div>
                Alerts
                {alerts > 0 && (
                  <Badge variant="destructive" className="ml-auto text-xs">{alerts}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!unassigned.length && !failedReminders.length ? (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">&#10003;</span>
                  </div>
                  <p className="text-sm text-muted-foreground">All clear! No alerts.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unassigned.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50/50">
                      <div>
                        <p className="font-medium text-sm">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(a.start_datetime), 'MMM d, h:mm a')} &bull; Needs staff assignment
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Unassigned</Badge>
                    </div>
                  ))}
                  {failedReminders.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50/50">
                      <div>
                        <p className="font-medium text-sm">{a.title}</p>
                        <p className="text-xs text-red-500">{a.reminder_error}</p>
                      </div>
                      <Badge variant="destructive" className="text-xs">Failed</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Staff */}
        <Card className="animate-slide-up" style={{ animationDelay: '480ms', animationFillMode: 'backwards' }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Team ({staffList?.length || 0})</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/staff')} className="text-xs text-muted-foreground hover:text-indigo-600">
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!staffList?.length ? (
              <p className="text-sm text-muted-foreground">No staff members.</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {staffList.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-accent transition-colors cursor-pointer flex-shrink-0 min-w-[90px]"
                  >
                    <div className={`w-12 h-12 rounded-xl ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center shadow-md`}>
                      <span className="text-sm font-bold text-white">{s.first_name[0]}{s.last_name[0]}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium whitespace-nowrap">{s.first_name}</p>
                      {s.role && <p className="text-[10px] text-muted-foreground whitespace-nowrap">{s.role}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* On-Call Nurses */}
        {onCallNurses && onCallNurses.length > 0 && (
          <Card className="animate-slide-up" style={{ animationDelay: '560ms', animationFillMode: 'backwards' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="w-8 h-8 rounded-lg gradient-rose flex items-center justify-center">
                    <HeartPulse className="h-4 w-4 text-white" />
                  </div>
                  On-Call Nurses
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/on-call')} className="text-xs text-muted-foreground hover:text-indigo-600">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {onCallNurses.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border bg-accent/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg gradient-rose flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {entry.nurse_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{entry.house_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{entry.nurse_name}</span>
                          {entry.nurse_phone && (
                            <span className="flex items-center gap-0.5">
                              <Phone className="h-3 w-3" />
                              {entry.nurse_phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {entry.nurse_phone && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600"
                        onClick={() => navigate(`/messaging?phone=${encodeURIComponent(entry.nurse_phone!)}&name=${encodeURIComponent(entry.nurse_name)}`)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
