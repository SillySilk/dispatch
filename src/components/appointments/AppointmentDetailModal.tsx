import { Calendar, MapPin, User, Clock, Home, MessageSquare, Phone, ExternalLink, Pencil } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog'
import type { Appointment, House, Staff } from '../../types'
import { format, parseISO } from 'date-fns'
import { useNavigate } from 'react-router-dom'

interface AppointmentDetailModalProps {
  appointment: Appointment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  houses?: House[]
  staff?: Staff[]
  onEdit?: (appointment: Appointment) => void
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  'no-show': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
}

export function AppointmentDetailModal({
  appointment,
  open,
  onOpenChange,
  houses,
  staff,
  onEdit,
}: AppointmentDetailModalProps) {
  const navigate = useNavigate()

  if (!appointment) return null

  const house = houses?.find(h => h.id === appointment.house_id)
  const assignedStaff = staff?.find(s => s.id === appointment.assigned_staff_id)
  const manager = house?.manager_id ? staff?.find(s => s.id === house.manager_id) : null
  const dateStr = format(parseISO(appointment.start_datetime), 'EEEE, MMM d, yyyy')
  const timeStr = format(parseISO(appointment.start_datetime), 'h:mm a')
  const endTimeStr = appointment.end_datetime
    ? format(parseISO(appointment.end_datetime), 'h:mm a')
    : null

  const address = appointment.location || appointment.house_address || house?.address
  const housePhone = appointment.house_phone || house?.phone
  const staffPhone = appointment.staff_phone || assignedStaff?.phone
  const managerPhone = manager?.phone

  // Build the prefilled message body for texting about this appointment
  const buildMessageBody = (): string => {
    const parts: string[] = []
    parts.push(`Re: ${appointment.title}`)
    parts.push(`Date: ${dateStr} at ${timeStr}${endTimeStr ? ` - ${endTimeStr}` : ''}`)
    if (address) {
      parts.push(`Location: ${address}`)
    }
    parts.push('')  // blank line before dispatcher types their message
    return parts.join('\n')
  }

  const handleTextStaff = () => {
    if (!staffPhone) return
    const name = assignedStaff ? `${assignedStaff.first_name} ${assignedStaff.last_name}` : appointment.staff_name || 'Staff'
    const body = buildMessageBody()
    onOpenChange(false)
    navigate(`/messaging?phone=${encodeURIComponent(staffPhone)}&name=${encodeURIComponent(name)}&body=${encodeURIComponent(body)}`)
  }

  const handleTextManager = () => {
    if (!managerPhone) return
    const name = `${manager!.first_name} ${manager!.last_name}`
    const body = buildMessageBody()
    onOpenChange(false)
    navigate(`/messaging?phone=${encodeURIComponent(managerPhone)}&name=${encodeURIComponent(name)}&body=${encodeURIComponent(body)}`)
  }

  const handleEdit = () => {
    onOpenChange(false)
    onEdit?.(appointment)
  }

  const mapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 max-w-lg">
        <div className="h-1.5 gradient-indigo" />
        <div className="p-6">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-indigo flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">{appointment.title}</DialogTitle>
                <DialogDescription className="mt-0.5">Appointment details</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={statusColors[appointment.status] || 'bg-gray-100 text-gray-700'}>
                {appointment.status}
              </Badge>
              {appointment.type && (
                <Badge variant="outline">{appointment.type}</Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="font-medium">{dateStr}</p>
                <p className="text-muted-foreground">
                  {timeStr}{endTimeStr ? ` - ${endTimeStr}` : ''}
                </p>
              </div>
            </div>

            {appointment.client_name && (
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{appointment.client_name}</span>
              </div>
            )}

            {(house || appointment.house_name) && (
              <div className="flex items-center gap-3 text-sm">
                <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <span>{house?.name || appointment.house_name}</span>
                  {housePhone && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {housePhone}
                    </span>
                  )}
                </div>
              </div>
            )}

            {address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                {mapsUrl ? (
                  <button
                    onClick={() => window.open(mapsUrl, '_blank')}
                    className="text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 text-left"
                  >
                    {address}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </button>
                ) : (
                  <span>{address}</span>
                )}
              </div>
            )}

            {(assignedStaff || appointment.staff_name) && (
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {assignedStaff ? `${assignedStaff.first_name} ${assignedStaff.last_name}` : appointment.staff_name}
                    {assignedStaff?.role && <span className="text-muted-foreground ml-1">({assignedStaff.role})</span>}
                  </span>
                  {staffPhone && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {staffPhone}
                    </span>
                  )}
                </div>
              </div>
            )}

            {manager && (
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {manager.first_name} {manager.last_name}
                    <span className="text-muted-foreground ml-1">(Manager)</span>
                  </span>
                  {managerPhone && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {managerPhone}
                    </span>
                  )}
                </div>
              </div>
            )}

            {appointment.notes && (
              <div className="rounded-lg bg-accent/50 p-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                <p>{appointment.notes}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-5 pt-4 border-t flex-wrap">
            {staffPhone && (
              <Button onClick={handleTextStaff} className="bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-md shadow-indigo-500/20">
                <MessageSquare className="h-4 w-4 mr-2" />
                Text Staff
              </Button>
            )}
            {managerPhone && (
              <Button onClick={handleTextManager} className="bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-md shadow-emerald-500/20">
                <MessageSquare className="h-4 w-4 mr-2" />
                Text Manager
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" onClick={handleEdit} className="ml-auto">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
