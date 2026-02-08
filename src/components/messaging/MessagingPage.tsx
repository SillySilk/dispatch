import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Send, MessageSquare, Phone, Clock, User, Hash, Home, ArrowDown } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { TopBar } from '../layout/TopBar'
import { useApi, useToast } from '../../hooks/useApi'
import { ToastContainer } from '../layout/ToastContainer'
import { AppointmentDetailModal } from '../appointments/AppointmentDetailModal'
import { HouseManagerSelector } from './HouseManagerSelector'
import type { Staff, Appointment, House, Message } from '../../types'
import { format, parseISO } from 'date-fns'

interface AdHocRecipient {
  phone: string
  name: string
}

export function MessagingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: staffList, loading: staffLoading } = useApi(() => window.api.staff.list())
  const { data: appointments } = useApi(() => window.api.appointments.list())
  const { data: houses } = useApi(() => window.api.houses.list())
  const { toasts, toast } = useToast()

  const [search, setSearch] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [adHocRecipient, setAdHocRecipient] = useState<AdHocRecipient | null>(null)
  const [customPhone, setCustomPhone] = useState('')
  const [customName, setCustomName] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [conversation, setConversation] = useState<Message[]>([])
  const [loadingConversation, setLoadingConversation] = useState(false)
  const [twilioFromNumber, setTwilioFromNumber] = useState<string | null>(null)

  // Modals
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showManagerSelector, setShowManagerSelector] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Load Twilio from number on mount
  useEffect(() => {
    window.api.settings.get('twilio_config').then(json => {
      if (json) {
        try {
          const config = JSON.parse(json)
          setTwilioFromNumber(config.fromNumber || null)
        } catch { /* ignore */ }
      }
    })
  }, [])

  // Handle URL search params for ad-hoc recipients
  useEffect(() => {
    const phone = searchParams.get('phone')
    const name = searchParams.get('name')
    if (phone) {
      const match = staffList?.find(s => s.phone === phone)
      if (match) {
        setSelectedStaff(match)
        setAdHocRecipient(null)
      } else {
        setSelectedStaff(null)
        setAdHocRecipient({ phone, name: name || phone })
        setCustomPhone(phone)
        setCustomName(name || '')
      }
      const body = searchParams.get('body')
      if (body) {
        setMessage(body)
      }
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, staffList])

  const recipientPhone = selectedStaff?.phone || adHocRecipient?.phone || null
  const recipientName = selectedStaff ? `${selectedStaff.first_name} ${selectedStaff.last_name}` : adHocRecipient?.name || ''

  // Load conversation when recipient changes
  const loadConversation = useCallback(async () => {
    if (!recipientPhone || !twilioFromNumber) {
      setConversation([])
      return
    }
    setLoadingConversation(true)
    try {
      // Fetch inbound from Twilio first (silently)
      await window.api.messages.fetchInbound(recipientPhone).catch(() => {})
      // Then load full conversation from DB
      const msgs = await window.api.messages.getConversation(twilioFromNumber, recipientPhone)
      setConversation(msgs)
    } catch {
      setConversation([])
    } finally {
      setLoadingConversation(false)
    }
  }, [recipientPhone, twilioFromNumber])

  useEffect(() => {
    loadConversation()
  }, [loadConversation])

  // Scroll to bottom when conversation loads
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  const filtered = staffList?.filter(s =>
    s.phone &&
    (`${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    s.role?.toLowerCase().includes(search.toLowerCase()))
  ) || []

  const staffAppointments = useMemo(() => {
    if (!selectedStaff || !appointments) return []
    return appointments
      .filter(a => a.assigned_staff_id === selectedStaff.id && a.status === 'scheduled')
      .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime))
  }, [selectedStaff, appointments])

  const handleSend = async () => {
    if (!recipientPhone || !message.trim()) return
    setSending(true)
    try {
      const result = await window.api.notifications.sendSms(
        recipientPhone,
        message.trim(),
        selectedStaff?.id,
        undefined
      )
      if (result.success) {
        toast('SMS sent successfully')
        setMessage('')
        await loadConversation()
      } else {
        toast(result.error || 'Failed to send SMS', 'error')
        await loadConversation()
      }
    } catch {
      toast('Failed to send SMS', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleCustomRecipient = () => {
    if (!customPhone.trim()) return
    setSelectedStaff(null)
    setAdHocRecipient({ phone: customPhone.trim(), name: customName.trim() || customPhone.trim() })
  }

  const handleSelectManager = (manager: Staff) => {
    if (manager.phone) {
      setSelectedStaff(manager)
      setAdHocRecipient(null)
    } else {
      toast('This manager has no phone number', 'error')
    }
  }

  // Sort conversation chronologically for display (oldest first)
  const sortedConversation = useMemo(
    () => [...conversation].sort((a, b) => a.sent_at.localeCompare(b.sent_at)),
    [conversation]
  )

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Messaging" />

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Staff list */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Custom number entry */}
          <div className="p-4 border-b space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Hash className="h-3 w-3" />
              Custom Number
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Phone"
                value={customPhone}
                onChange={e => setCustomPhone(e.target.value)}
                className="text-sm"
              />
              <Button size="sm" variant="outline" onClick={handleCustomRecipient} disabled={!customPhone.trim()}>
                Go
              </Button>
            </div>
            <Input
              placeholder="Name (optional)"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Text House Manager button */}
          <div className="p-3 border-b">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => setShowManagerSelector(true)}
            >
              <Home className="h-4 w-4 text-emerald-500" />
              Text House Manager
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {staffLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading...</p>
            ) : !filtered.length ? (
              <div className="p-6 text-center">
                <Phone className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {search ? 'No staff found' : 'No staff with phone numbers'}
                </p>
              </div>
            ) : (
              <div className="space-y-0.5 p-2">
                {filtered.map(s => (
                  <button
                    key={s.id}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                      selectedStaff?.id === s.id
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => { setSelectedStaff(s); setAdHocRecipient(null) }}
                  >
                    <div className="w-10 h-10 rounded-xl gradient-violet flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-xs font-bold text-white">{s.first_name[0]}{s.last_name[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.first_name} {s.last_name}</p>
                      <p className="text-xs text-muted-foreground">{s.phone}</p>
                    </div>
                    {s.role && <Badge variant="outline" className="text-xs ml-auto flex-shrink-0">{s.role}</Badge>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Conversation + Compose */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedStaff && !adHocRecipient ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl gradient-indigo flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Select a staff member</h3>
                <p className="text-sm text-muted-foreground">Choose a recipient from the list to compose a message</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Recipient header */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${selectedStaff ? 'gradient-violet' : 'bg-slate-500'} flex items-center justify-center shadow-sm`}>
                    {selectedStaff ? (
                      <span className="text-xs font-bold text-white">{selectedStaff.first_name[0]}{selectedStaff.last_name[0]}</span>
                    ) : (
                      <Hash className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{recipientName}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {recipientPhone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick-fill appointments (staff only) */}
              {selectedStaff && staffAppointments.length > 0 && (
                <div className="p-3 border-b">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                    <Clock className="h-3 w-3 text-indigo-500" />
                    Upcoming Appointments
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {staffAppointments.slice(0, 5).map(a => (
                      <button
                        key={a.id}
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg border hover:bg-accent transition-colors text-left"
                        onClick={() => setSelectedAppointment(a)}
                      >
                        <p className="text-xs font-medium truncate max-w-[160px]">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(a.start_datetime), 'MMM d, h:mm a')}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loadingConversation ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Loading conversation...</p>
                ) : sortedConversation.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                  </div>
                ) : (
                  sortedConversation.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          msg.direction === 'outbound'
                            ? msg.status === 'failed'
                              ? 'bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20'
                              : 'bg-indigo-500 text-white'
                            : 'bg-accent border'
                        }`}
                      >
                        <p className={`text-sm whitespace-pre-wrap ${
                          msg.direction === 'outbound' && msg.status !== 'failed' ? 'text-white' : ''
                        }`}>
                          {msg.body}
                        </p>
                        <div className={`flex items-center gap-1.5 mt-1 ${
                          msg.direction === 'outbound' && msg.status !== 'failed'
                            ? 'text-indigo-200'
                            : 'text-muted-foreground'
                        }`}>
                          <span className="text-xs">
                            {format(parseISO(msg.sent_at), 'MMM d, h:mm a')}
                          </span>
                          {msg.status && msg.status !== 'failed' && msg.direction === 'outbound' && (
                            <span className="text-xs opacity-70">{msg.status}</span>
                          )}
                          {msg.error_message && (
                            <span className="text-xs text-red-500">{msg.error_message}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Compose area */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <textarea
                    className="flex-1 min-h-[48px] max-h-[120px] p-3 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Type your message..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!message.trim() || sending}
                    className="self-end bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-md shadow-indigo-500/20 h-12 w-12 p-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {message.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{message.length} characters</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        appointment={selectedAppointment}
        open={!!selectedAppointment}
        onOpenChange={open => { if (!open) setSelectedAppointment(null) }}
        houses={houses || []}
        staff={staffList || []}
      />

      {/* House Manager Selector */}
      <HouseManagerSelector
        open={showManagerSelector}
        onOpenChange={setShowManagerSelector}
        houses={houses || []}
        staff={staffList || []}
        onSelectManager={handleSelectManager}
      />

      <ToastContainer toasts={toasts} />
    </div>
  )
}
