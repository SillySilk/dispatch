import { useState, useEffect } from 'react'
import { Calendar, MapPin, BookmarkPlus } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { useApi } from '../../hooks/useApi'
import type { Appointment } from '../../types'

interface AppointmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment?: Appointment | null
  onSave: () => void
  toast: (msg: string, type?: 'success' | 'error') => void
}

const APPOINTMENT_TYPES = ['Medical', 'Dental', 'Therapy', 'Social', 'Administrative', 'Other']
const STATUSES = ['scheduled', 'completed', 'cancelled', 'no-show']

const statusColors: Record<string, string> = {
  scheduled: 'text-indigo-600',
  completed: 'text-emerald-600',
  cancelled: 'text-red-600',
  'no-show': 'text-amber-600',
}

export function AppointmentForm({ open, onOpenChange, appointment, onSave, toast }: AppointmentFormProps) {
  const { data: houses } = useApi(() => window.api.houses.list())
  const { data: clients } = useApi(() => window.api.clients.list())
  const { data: staffList } = useApi(() => window.api.staff.list())

  const [title, setTitle] = useState('')
  const [type, setType] = useState('')
  const [clientId, setClientId] = useState('')
  const [houseId, setHouseId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [location, setLocation] = useState('')
  const [startDatetime, setStartDatetime] = useState('')
  const [endDatetime, setEndDatetime] = useState('')
  const [status, setStatus] = useState('scheduled')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingContact, setSavingContact] = useState(false)

  useEffect(() => {
    if (appointment && open) {
      setTitle(appointment.title)
      setType(appointment.type || '')
      setClientId(appointment.client_id?.toString() || '')
      setHouseId(appointment.house_id?.toString() || '')
      setStaffId(appointment.assigned_staff_id?.toString() || '')
      setLocation(appointment.location || '')
      setStartDatetime(appointment.start_datetime?.slice(0, 16) || '')
      setEndDatetime(appointment.end_datetime?.slice(0, 16) || '')
      setStatus(appointment.status)
      setNotes(appointment.notes || '')
    } else if (open) {
      setTitle('')
      setType('')
      setClientId('')
      setHouseId('')
      setStaffId('')
      setLocation('')
      setStartDatetime('')
      setEndDatetime('')
      setStatus('scheduled')
      setNotes('')
    }
  }, [appointment, open])

  useEffect(() => {
    if (clientId && clients) {
      const client = clients.find(c => c.id === Number(clientId))
      if (client?.house_id) {
        setHouseId(client.house_id.toString())
      }
    }
  }, [clientId, clients])

  const handleSaveToContacts = async () => {
    if (!location.trim() || !clientId || clientId === 'none') return
    setSavingContact(true)
    try {
      const category = type === 'Medical' || type === 'Dental' ? 'medical' : 'community'
      await window.api.clientContacts.create({
        client_id: Number(clientId),
        name: title.trim() || location.trim(),
        category,
        address: location.trim(),
        notes: title.trim() ? `Saved from appointment: ${title.trim()}` : undefined,
      })
      toast('Location saved to client contacts')
    } catch {
      toast('Failed to save location', 'error')
    } finally {
      setSavingContact(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !startDatetime) {
      toast('Title and start time are required', 'error')
      return
    }

    setSaving(true)
    try {
      const data = {
        title: title.trim(),
        type: type || null,
        client_id: clientId ? Number(clientId) : null,
        house_id: houseId ? Number(houseId) : null,
        assigned_staff_id: staffId ? Number(staffId) : null,
        location: location || null,
        start_datetime: startDatetime,
        end_datetime: endDatetime || null,
        status,
        notes: notes || null,
      }
      if (appointment) {
        await window.api.appointments.update(appointment.id, data)
        toast('Appointment updated')
      } else {
        await window.api.appointments.create(data)
        toast('Appointment created')
      }
      onSave()
      onOpenChange(false)
    } catch {
      toast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden p-0">
        <div className="h-1.5 gradient-indigo" />
        <div className="p-6 max-h-[calc(90vh-6px)] overflow-y-auto">
          <DialogHeader className="mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-indigo flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">{appointment ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
                <DialogDescription className="mt-0.5">
                  {appointment ? 'Update appointment details.' : 'Schedule a new appointment.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Appointment title" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => (
                      <SelectItem key={s} value={s}>
                        <span className={statusColors[s]}>{s}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-accent/30 border space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assignments</p>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client</SelectItem>
                    {clients?.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.first_name} {c.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">House</Label>
                  <Select value={houseId} onValueChange={setHouseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select house" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No house</SelectItem>
                      {houses?.map(h => (
                        <SelectItem key={h.id} value={h.id.toString()}>{h.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Assigned Staff</Label>
                  <Select value={staffId} onValueChange={setStaffId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {staffList?.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.first_name} {s.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Address or location name" className="pl-10" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  disabled={!location.trim() || !clientId || clientId === 'none' || savingContact}
                  onClick={handleSaveToContacts}
                  title="Save location to client's contacts"
                >
                  <BookmarkPlus className="h-4 w-4" />
                </Button>
              </div>
              {clientId && clientId !== 'none' && location.trim() && (
                <p className="text-[11px] text-muted-foreground">Click the bookmark to save this location to the client's contacts.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start *</Label>
                <Input type="datetime-local" value={startDatetime} onChange={e => setStartDatetime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">End</Label>
                <Input type="datetime-local" value={endDatetime} onChange={e => setEndDatetime(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-md shadow-indigo-500/20">
                {saving ? 'Saving...' : appointment ? 'Update Appointment' : 'Create Appointment'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
