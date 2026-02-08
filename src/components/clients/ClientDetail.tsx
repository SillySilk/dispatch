import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Calendar as CalendarIcon, Phone, Mail, AlertCircle, MessageSquare, BookUser } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { TopBar } from '../layout/TopBar'
import { ClientAccountVault } from './ClientAccountVault'
import { ClientContactsPanel } from './ClientContactsPanel'
import { useApi } from '../../hooks/useApi'
import { format, parseISO } from 'date-fns'

export function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const clientId = Number(id)

  const { data: client, loading } = useApi(() => window.api.clients.get(clientId), [clientId])
  const { data: appointments } = useApi(() => window.api.appointments.list(), [clientId])
  const { data: houses } = useApi(() => window.api.houses.list())

  const clientAppointments = appointments?.filter(a => a.client_id === clientId) || []
  const houseName = client?.house_id ? houses?.find(h => h.id === client.house_id)?.name : null

  if (loading) return <div className="p-6">Loading...</div>
  if (!client) return <div className="p-6">Client not found</div>

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title={`${client.first_name} ${client.last_name}`}>
        <Button variant="outline" onClick={() => navigate('/clients')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </TopBar>

      <div className="p-6 animate-fade-in">
        {/* Hero */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-2 gradient-sky" />
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-sky flex items-center justify-center shadow-lg shadow-sky-500/20 flex-shrink-0">
                <span className="text-xl font-bold text-white">{client.first_name[0]}{client.last_name[0]}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{client.first_name} {client.last_name}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  {houseName && <Badge variant="secondary" className="gap-1 px-3 py-1">{houseName}</Badge>}
                  {client.dob && <Badge variant="outline" className="px-3 py-1">DOB: {client.dob}</Badge>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="info">
          <TabsList className="mb-4">
            <TabsTrigger value="info" className="gap-1.5">
              <User className="h-3.5 w-3.5" />
              Info
            </TabsTrigger>
            <TabsTrigger value="appointments" className="gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-1.5">
              <BookUser className="h-3.5 w-3.5" />
              Contacts & Places
            </TabsTrigger>
            <TabsTrigger value="vault" className="gap-1.5">
              Accounts Vault
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {client.phone && (
                    <div className="p-3 rounded-lg bg-accent/50">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Phone</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{client.phone}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-indigo-50 hover:text-indigo-600" onClick={() => navigate(`/messaging?phone=${encodeURIComponent(client.phone!)}&name=${encodeURIComponent(`${client.first_name} ${client.last_name}`)}`)} title="Send SMS">
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {client.email && (
                    <div className="p-3 rounded-lg bg-accent/50">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Email</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{client.email}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-indigo-50 hover:text-indigo-600" onClick={() => window.open(`mailto:${client.email}`)} title="Send Email">
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {client.emergency_contact && (
                    <div className="p-3 rounded-lg bg-accent/50">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Emergency Contact</p>
                      <p className="text-sm font-medium">{client.emergency_contact}</p>
                    </div>
                  )}
                  {houseName && (
                    <div className="p-3 rounded-lg bg-accent/50">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">House</p>
                      <p className="text-sm font-medium">{houseName}</p>
                    </div>
                  )}
                </div>
                {client.notes && (
                  <div className="mt-4 p-3 rounded-lg bg-accent/50">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm">{client.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Appointments ({clientAppointments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {!clientAppointments.length ? (
                  <div className="py-8 text-center">
                    <CalendarIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No appointments for this client.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientAppointments.map(a => {
                      const statusColors: Record<string, string> = {
                        scheduled: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                        completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        cancelled: 'bg-red-50 text-red-700 border-red-200',
                        'no-show': 'bg-amber-50 text-amber-700 border-amber-200',
                      }
                      return (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-1 h-10 rounded-full bg-indigo-400" />
                            <div>
                              <p className="font-medium text-sm">{a.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(a.start_datetime), 'MMM d, yyyy h:mm a')}
                                {a.staff_name && ` \u2022 ${a.staff_name}`}
                              </p>
                            </div>
                          </div>
                          <Badge className={`text-xs border ${statusColors[a.status] || ''}`}>
                            {a.status}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <ClientContactsPanel clientId={clientId} />
          </TabsContent>

          <TabsContent value="vault">
            <ClientAccountVault clientId={clientId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
