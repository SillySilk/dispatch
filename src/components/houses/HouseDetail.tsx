import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Phone, Users, UserCog, Home, MessageSquare } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { TopBar } from '../layout/TopBar'
import { useApi } from '../../hooks/useApi'

export function HouseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const houseId = Number(id)

  const { data: house, loading } = useApi(() => window.api.houses.get(houseId), [houseId])
  const { data: clients } = useApi(() => window.api.clients.byHouse(houseId), [houseId])
  const { data: staff } = useApi(() => window.api.staff.byHouse(houseId), [houseId])

  if (loading) return <div className="p-6">Loading...</div>
  if (!house) return <div className="p-6">House not found</div>

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title={house.name}>
        <Button variant="outline" onClick={() => navigate('/houses')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </TopBar>

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Hero Card */}
        <Card className="overflow-hidden">
          <div className="h-2 gradient-indigo" />
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl gradient-indigo flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                <Home className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{house.name}</h2>
                <div className="flex flex-wrap gap-3">
                  {house.address && (
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                      <MapPin className="h-3 w-3" />
                      {house.address}
                    </Badge>
                  )}
                  {house.phone && (
                    <span className="flex items-center gap-1">
                      <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                        <Phone className="h-3 w-3" />
                        {house.phone}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-indigo-50 hover:text-indigo-600" onClick={() => navigate(`/messaging?phone=${encodeURIComponent(house.phone!)}&name=${encodeURIComponent(house.name)}`)} title="Send SMS">
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                    </span>
                  )}
                </div>
                {house.notes && <p className="text-sm text-muted-foreground mt-2">{house.notes}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Clients */}
          <Card className="border-l-4 border-l-sky-500/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-sky-500" />
                Clients ({clients?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!clients?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No clients assigned to this house.</p>
              ) : (
                <div className="space-y-2">
                  {clients.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors animate-slide-up"
                      style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
                      onClick={() => navigate(`/clients/${c.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg gradient-sky flex items-center justify-center text-xs font-bold text-white shadow-sm">
                          {c.first_name[0]}{c.last_name[0]}
                        </div>
                        <div>
                          <span className="text-sm font-medium">{c.first_name} {c.last_name}</span>
                          {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Staff */}
          <Card className="border-l-4 border-l-violet-500/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCog className="h-5 w-5 text-violet-500" />
                Staff ({staff?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!staff?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No staff assigned to this house.</p>
              ) : (
                <div className="space-y-2">
                  {staff.map((s, i) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors animate-slide-up"
                      style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
                      onClick={() => navigate(`/staff/${s.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg gradient-violet flex items-center justify-center text-xs font-bold text-white shadow-sm">
                          {s.first_name[0]}{s.last_name[0]}
                        </div>
                        <div>
                          <span className="text-sm font-medium">{s.first_name} {s.last_name}</span>
                          {s.role && <p className="text-xs text-muted-foreground">{s.role}</p>}
                        </div>
                      </div>
                      {s.role && <Badge variant="outline" className="text-xs">{s.role}</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
