import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Calendar as CalendarIcon, List, Search, MapPin, Phone } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, isToday, parseISO, addMonths, subMonths } from 'date-fns'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { TopBar } from '../layout/TopBar'
import { ToastContainer } from '../layout/ToastContainer'
import { AppointmentForm } from './AppointmentForm'
import { AppointmentDetailModal } from './AppointmentDetailModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { useApi, useToast } from '../../hooks/useApi'
import type { Appointment } from '../../types'

const statusStyles: Record<string, { badge: string; bar: string }> = {
  scheduled: { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', bar: 'bg-indigo-400' },
  completed: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-400' },
  cancelled: { badge: 'bg-red-50 text-red-700 border-red-200', bar: 'bg-red-400' },
  'no-show': { badge: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'bg-amber-400' },
}

const typeColors: Record<string, string> = {
  Medical: 'bg-blue-100 text-blue-700',
  Dental: 'bg-cyan-100 text-cyan-700',
  Therapy: 'bg-violet-100 text-violet-700',
  Social: 'bg-emerald-100 text-emerald-700',
  Administrative: 'bg-slate-100 text-slate-700',
  Other: 'bg-gray-100 text-gray-700',
}

export function AppointmentListPage() {
  const { data: appointments, loading, refresh } = useApi(() => window.api.appointments.list())
  const { data: houses } = useApi(() => window.api.houses.list())
  const { data: staffList } = useApi(() => window.api.staff.list())
  const { toasts, toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editAppt, setEditAppt] = useState<Appointment | null>(null)
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [statusFilter, setStatusFilter] = useState('all')
  const [houseFilter, setHouseFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  const filtered = useMemo(() => {
    let list = appointments || []
    if (statusFilter !== 'all') list = list.filter(a => a.status === statusFilter)
    if (houseFilter !== 'all') list = list.filter(a => a.house_id?.toString() === houseFilter)
    if (search) list = list.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.client_name?.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [appointments, statusFilter, houseFilter, search])

  const handleDelete = async (a: Appointment) => {
    if (!confirm(`Delete "${a.title}"?`)) return
    try {
      await window.api.appointments.delete(a.id)
      toast('Appointment deleted')
      refresh()
    } catch {
      toast('Failed to delete', 'error')
    }
  }

  const handleEditFromDetail = (a: Appointment) => {
    setDetailAppt(null)
    setEditAppt(a)
    setFormOpen(true)
  }

  const monthStart = startOfMonth(calendarMonth)
  const monthEnd = endOfMonth(calendarMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getAppointmentsForDay = (day: Date) => {
    return filtered.filter(a => {
      try { return isSameDay(parseISO(a.start_datetime), day) } catch { return false }
    })
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Appointments">
        <div className="flex gap-2">
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-9 w-9"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'calendar' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-9 w-9"
            onClick={() => setView('calendar')}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => { setEditAppt(null); setFormOpen(true) }}
            className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-md shadow-indigo-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        </div>
      </TopBar>

      <div className="p-6 space-y-4 flex-1">
        {/* Filters */}
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no-show">No Show</SelectItem>
            </SelectContent>
          </Select>
          <Select value={houseFilter} onValueChange={setHouseFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="House" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Houses</SelectItem>
              {houses?.map(h => (
                <SelectItem key={h.id} value={h.id.toString()}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : view === 'list' ? (
          !filtered.length ? (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="w-20 h-20 rounded-2xl gradient-indigo flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20">
                <CalendarIcon className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No appointments found</h3>
              <p className="text-muted-foreground text-sm mb-6">Try adjusting your filters or create a new appointment.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((a, i) => {
                const style = statusStyles[a.status] || statusStyles.scheduled
                return (
                  <Card
                    key={a.id}
                    className="overflow-hidden animate-slide-up cursor-pointer hover:shadow-md transition-shadow"
                    style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
                    onClick={() => setDetailAppt(a)}
                  >
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className={`w-1 ${style.bar} flex-shrink-0`} />
                        <div className="flex-1 p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Time */}
                            <div className="text-center w-16 flex-shrink-0">
                              <p className="text-xs font-semibold text-indigo-600">
                                {format(parseISO(a.start_datetime), 'h:mm a')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(a.start_datetime), 'MMM d')}
                              </p>
                            </div>
                            <div className="w-px h-10 bg-border" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm">{a.title}</h3>
                                {a.type && (
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${typeColors[a.type] || typeColors.Other}`}>
                                    {a.type}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                                {a.client_name && <span>{a.client_name}</span>}
                                {a.house_name && <span>{a.house_name}</span>}
                                {a.staff_name && <span>{a.staff_name}</span>}
                                {(a.location || a.house_address) && (
                                  <span className="flex items-center gap-0.5">
                                    <MapPin className="h-3 w-3" />
                                    {a.location || a.house_address}
                                  </span>
                                )}
                                {a.house_phone && (
                                  <span className="flex items-center gap-0.5">
                                    <Phone className="h-3 w-3" />
                                    {a.house_phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge className={`text-xs border ${style.badge}`}>{a.status}</Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600" onClick={(e) => { e.stopPropagation(); setEditAppt(a); setFormOpen(true) }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(a) }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )
        ) : (
          /* CALENDAR VIEW */
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="sm" onClick={() => setCalendarMonth(m => subMonths(m, 1))}>Prev</Button>
              <h3 className="font-bold text-lg">{format(calendarMonth, 'MMMM yyyy')}</h3>
              <Button variant="outline" size="sm" onClick={() => setCalendarMonth(m => addMonths(m, 1))}>Next</Button>
            </div>
            <Card className="overflow-hidden">
              <div className="grid grid-cols-7">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="bg-accent/50 p-3 text-center text-xs font-semibold text-muted-foreground border-b">{d}</div>
                ))}
                {calendarDays.map(day => {
                  const dayAppts = getAppointmentsForDay(day)
                  const inMonth = day.getMonth() === calendarMonth.getMonth()
                  return (
                    <div
                      key={day.toISOString()}
                      className={`border-b border-r p-2 min-h-[90px] transition-colors hover:bg-accent/30 ${!inMonth ? 'opacity-30 bg-accent/10' : 'bg-white'} ${isToday(day) ? 'ring-2 ring-indigo-400 ring-inset bg-indigo-50/30' : ''}`}
                    >
                      <div className={`text-xs font-semibold mb-1 ${isToday(day) ? 'text-indigo-600' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      {dayAppts.slice(0, 3).map(a => (
                        <div
                          key={a.id}
                          className="text-[10px] truncate px-1.5 py-0.5 mb-0.5 rounded bg-indigo-100 text-indigo-700 cursor-pointer hover:bg-indigo-200 transition-colors font-medium"
                          onClick={() => setDetailAppt(a)}
                        >
                          {format(parseISO(a.start_datetime), 'h:mm')} {a.title}
                        </div>
                      ))}
                      {dayAppts.length > 3 && (
                        <div className="text-[10px] text-muted-foreground font-medium">+{dayAppts.length - 3} more</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}
      </div>

      <AppointmentForm open={formOpen} onOpenChange={setFormOpen} appointment={editAppt} onSave={refresh} toast={toast} />
      <AppointmentDetailModal
        appointment={detailAppt}
        open={!!detailAppt}
        onOpenChange={(open) => { if (!open) setDetailAppt(null) }}
        houses={houses || undefined}
        staff={staffList || undefined}
        onEdit={handleEditFromDetail}
      />
      <ToastContainer toasts={toasts} />
    </div>
  )
}
