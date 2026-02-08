import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, UserCog, Calendar as CalendarIcon, Phone, Mail, Home, MessageSquare } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { TopBar } from '../layout/TopBar'
import { useApi } from '../../hooks/useApi'
import { format, parseISO } from 'date-fns'

export function StaffDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const staffId = Number(id)

  const { data: staff, loading } = useApi(() => window.api.staff.get(staffId), [staffId])
  const { data: houseIds } = useApi(() => window.api.staff.getHouses(staffId), [staffId])
  const { data: houses } = useApi(() => window.api.houses.list())
  const { data: appointments } = useApi(() => window.api.appointments.list(), [staffId])

  const assignedHouses = houses?.filter(h => houseIds?.includes(h.id)) || []
  const staffAppointments = appointments?.filter(a => a.assigned_staff_id === staffId) || []

  if (loading) return <div className="p-6">Loading...</div>
  if (!staff) return <div className="p-6">Staff member not found</div>

  const statusColors: Record<string, string> = {
    scheduled: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    'no-show': 'bg-amber-50 text-amber-700 border-amber-200',
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title={`${staff.first_name} ${staff.last_name}`}>
        <Button variant="outline" onClick={() => navigate('/staff')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </TopBar>

      <div className="p-6 animate-fade-in">
        {/* Hero */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-2 gradient-violet" />
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-violet flex items-center justify-center shadow-lg shadow-violet-500/20 flex-shrink-0">
                <span className="text-xl font-bold text-white">{staff.first_name[0]}{staff.last_name[0]}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{staff.first_name} {staff.last_name}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  {staff.role && <Badge variant="secondary" className="gap-1 px-3 py-1">{staff.role}</Badge>}
                  {staff.phone && (
                    <span className="flex items-center gap-1">
                      <Badge variant="outline" className="gap-1 px-3 py-1">
                        <Phone className="h-3 w-3" />
                        {staff.phone}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-indigo-50 hover:text-indigo-600" onClick={() => navigate(`/messaging?phone=${encodeURIComponent(staff.phone!)}&name=${encodeURIComponent(`${staff.first_name} ${staff.last_name}`)}`)} title="Send SMS">
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                    </span>
                  )}
                  {staff.email && (
                    <span className="flex items-center gap-1">
                      <Badge variant="outline" className="gap-1 px-3 py-1">
                        <Mail className="h-3 w-3" />
                        {staff.email}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-indigo-50 hover:text-indigo-600" onClick={() => window.open(`mailto:${staff.email}`)} title="Send Email">
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="info">
          <TabsList className="mb-4">
            <TabsTrigger value="info" className="gap-1.5">
              <UserCog className="h-3.5 w-3.5" />
              Info
            </TabsTrigger>
            <TabsTrigger value="appointments" className="gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              Appointments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {staff.phone && (
                      <div className="p-3 rounded-lg bg-accent/50">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Phone</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{staff.phone}</p>
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-indigo-50 hover:text-indigo-600" onClick={() => navigate(`/messaging?phone=${encodeURIComponent(staff.phone!)}&name=${encodeURIComponent(`${staff.first_name} ${staff.last_name}`)}`)} title="Send SMS">
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {staff.email && (
                      <div className="p-3 rounded-lg bg-accent/50">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Email</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{staff.email}</p>
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-indigo-50 hover:text-indigo-600" onClick={() => window.open(`mailto:${staff.email}`)} title="Send Email">
                            <Mail className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {staff.role && (
                      <div className="p-3 rounded-lg bg-accent/50">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Role</p>
                        <p className="text-sm font-medium">{staff.role}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-indigo-500/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Home className="h-5 w-5 text-indigo-500" />
                    Assigned Houses ({assignedHouses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!assignedHouses.length ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No houses assigned.</p>
                  ) : (
                    <div className="space-y-2">
                      {assignedHouses.map((h, i) => (
                        <div
                          key={h.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors animate-slide-up"
                          style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
                          onClick={() => navigate(`/houses/${h.id}`)}
                        >
                          <div className="w-9 h-9 rounded-lg gradient-indigo flex items-center justify-center text-xs font-bold text-white shadow-sm">
                            <Home className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-sm font-medium">{h.name}</span>
                            {h.address && <p className="text-xs text-muted-foreground">{h.address}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Appointments ({staffAppointments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {!staffAppointments.length ? (
                  <div className="py-8 text-center">
                    <CalendarIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No appointments assigned to this staff member.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {staffAppointments.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-10 rounded-full bg-violet-400" />
                          <div>
                            <p className="font-medium text-sm">{a.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(a.start_datetime), 'MMM d, yyyy h:mm a')}
                              {a.client_name && ` \u2022 ${a.client_name}`}
                            </p>
                          </div>
                        </div>
                        <Badge className={`text-xs border ${statusColors[a.status] || ''}`}>
                          {a.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
