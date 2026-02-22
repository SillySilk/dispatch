import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Phone, Users, UserCog, Home, MessageSquare, Key, PhoneCall, Settings, ClipboardList, FileText, Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { TopBar } from '../layout/TopBar'
import { useApi } from '../../hooks/useApi'

const RESOURCE_CATEGORIES = [
  { value: 'credential', label: 'Credential', icon: Key, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { value: 'vendor',     label: 'Vendor',     icon: PhoneCall, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { value: 'utility',    label: 'Utility',    icon: Settings, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { value: 'procedure',  label: 'Procedure',  icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { value: 'note',       label: 'Note',       icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  { value: 'other',      label: 'Other',      icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
]

const getCategoryMeta = (cat: string) =>
  RESOURCE_CATEGORIES.find(c => c.value === cat) ?? RESOURCE_CATEGORIES[RESOURCE_CATEGORIES.length - 1]

const EMPTY_FORM = { name: '', category: 'credential', username: '', password: '', url: '', value: '', notes: '' }

export function HouseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const houseId = Number(id)

  const { data: house, loading } = useApi(() => window.api.houses.get(houseId), [houseId])
  const { data: clients } = useApi(() => window.api.clients.byHouse(houseId), [houseId])
  const { data: staff } = useApi(() => window.api.staff.byHouse(houseId), [houseId])

  const [resources, setResources] = useState<any[]>([])
  const [showResourceForm, setShowResourceForm] = useState(false)
  const [editingResource, setEditingResource] = useState<any | null>(null)
  const [resourceForm, setResourceForm] = useState({ ...EMPTY_FORM })
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!houseId) return
    window.api.houseResources.list(houseId).then(data => setResources(data as any[]))
  }, [houseId])

  const handleEditResource = (r: any) => {
    setEditingResource(r)
    setResourceForm({ name: r.name, category: r.category, username: r.username ?? '', password: r.password ?? '', url: r.url ?? '', value: r.value ?? '', notes: r.notes ?? '' })
    setShowResourceForm(true)
  }

  const handleSaveResource = async () => {
    setSaving(true)
    try {
      if (editingResource) {
        await window.api.houseResources.update(editingResource.id, { ...resourceForm, house_id: houseId })
      } else {
        await window.api.houseResources.create({ ...resourceForm, house_id: houseId })
      }
      const updated = await window.api.houseResources.list(houseId)
      setResources(updated as any[])
      setShowResourceForm(false)
      setEditingResource(null)
      setResourceForm({ ...EMPTY_FORM })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteResource = async (resourceId: number) => {
    if (!confirm('Delete this resource?')) return
    await window.api.houseResources.delete(resourceId)
    setResources(resources.filter((r: any) => r.id !== resourceId))
  }

  const handleCancelForm = () => {
    setShowResourceForm(false)
    setEditingResource(null)
    setResourceForm({ ...EMPTY_FORM })
  }

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
                  {(clients as any[]).map((c: any, i: number) => (
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
                  {(staff as any[]).map((s: any, i: number) => (
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

        {/* Resources */}
        <Card className="border-l-4 border-l-indigo-500/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="h-5 w-5 text-indigo-500" />
              House Resources ({resources.length})
            </CardTitle>
            <Button size="sm" onClick={() => { setEditingResource(null); setResourceForm({ ...EMPTY_FORM }); setShowResourceForm(true) }}>
              <Plus className="h-4 w-4 mr-1" />
              Add Resource
            </Button>
          </CardHeader>
          <CardContent>
            {/* Inline form */}
            {showResourceForm && (
              <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-3">
                <p className="text-sm font-medium">{editingResource ? 'Edit Resource' : 'New Resource'}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 flex gap-3">
                    <input
                      className="flex-1 px-3 py-1.5 text-sm border rounded-md bg-background"
                      placeholder="Name *"
                      value={resourceForm.name}
                      onChange={e => setResourceForm(f => ({ ...f, name: e.target.value }))}
                    />
                    <select
                      className="px-3 py-1.5 text-sm border rounded-md bg-background"
                      value={resourceForm.category}
                      onChange={e => setResourceForm(f => ({ ...f, category: e.target.value }))}
                    >
                      {RESOURCE_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    className="px-3 py-1.5 text-sm border rounded-md bg-background"
                    placeholder="Username"
                    value={resourceForm.username}
                    onChange={e => setResourceForm(f => ({ ...f, username: e.target.value }))}
                  />
                  <input
                    className="px-3 py-1.5 text-sm border rounded-md bg-background"
                    placeholder="Password"
                    type="text"
                    value={resourceForm.password}
                    onChange={e => setResourceForm(f => ({ ...f, password: e.target.value }))}
                  />
                  <input
                    className="px-3 py-1.5 text-sm border rounded-md bg-background col-span-2"
                    placeholder="URL"
                    value={resourceForm.url}
                    onChange={e => setResourceForm(f => ({ ...f, url: e.target.value }))}
                  />
                  <input
                    className="px-3 py-1.5 text-sm border rounded-md bg-background col-span-2"
                    placeholder="Value (phone number, account number, etc.)"
                    value={resourceForm.value}
                    onChange={e => setResourceForm(f => ({ ...f, value: e.target.value }))}
                  />
                  <textarea
                    className="px-3 py-1.5 text-sm border rounded-md bg-background col-span-2 resize-none"
                    placeholder="Notes"
                    rows={2}
                    value={resourceForm.notes}
                    onChange={e => setResourceForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={handleCancelForm}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveResource} disabled={!resourceForm.name || saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </div>
            )}

            {!resources.length && !showResourceForm ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No resources added yet.</p>
            ) : (
              <div className="space-y-2">
                {resources.map((r: any) => {
                  const meta = getCategoryMeta(r.category)
                  const Icon = meta.icon
                  return (
                    <div key={r.id} className={`flex items-start gap-3 p-3 rounded-lg border ${meta.border} ${meta.bg}`}>
                      <div className={`mt-0.5 flex-shrink-0 ${meta.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{r.name}</span>
                          <Badge variant="outline" className={`text-xs ${meta.color}`}>{meta.label}</Badge>
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {r.username && <p className="text-xs text-muted-foreground">User: <span className="font-mono text-foreground">{r.username}</span></p>}
                          {r.password && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              Pass:{' '}
                              <span className="font-mono text-foreground">
                                {showPasswords[r.id] ? r.password : '••••••••'}
                              </span>
                              <button
                                className="ml-1 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPasswords(p => ({ ...p, [r.id]: !p[r.id] }))}
                              >
                                {showPasswords[r.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </button>
                            </p>
                          )}
                          {r.url && (
                            <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />{r.url}
                            </a>
                          )}
                          {r.value && <p className="text-xs text-muted-foreground">{r.value}</p>}
                          {r.notes && <p className="text-xs text-muted-foreground italic">{r.notes}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditResource(r)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteResource(r.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
