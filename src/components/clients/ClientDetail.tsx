import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Calendar as CalendarIcon, Phone, Mail, AlertCircle, MessageSquare, BookUser, Globe, Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, CreditCard } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { TopBar } from '../layout/TopBar'
import { ClientContactsPanel } from './ClientContactsPanel'
import { useApi } from '../../hooks/useApi'
import { format, parseISO } from 'date-fns'

const EMPTY_ACCOUNT_FORM = { service_name: '', service_url: '', username: '', password: '', notes: '' }

export function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const clientId = Number(id)

  const { data: client, loading } = useApi(() => window.api.clients.get(clientId), [clientId])
  const { data: appointments } = useApi(() => window.api.appointments.list(), [clientId])
  const { data: houses } = useApi(() => window.api.houses.list())

  const clientAppointments = appointments?.filter((a: any) => a.client_id === clientId) || []
  const houseName = client?.house_id ? (houses as any[])?.find((h: any) => h.id === client.house_id)?.name : null

  // Accounts state
  const [accounts, setAccounts] = useState<any[]>([])
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<any | null>(null)
  const [accountForm, setAccountForm] = useState({ ...EMPTY_ACCOUNT_FORM })
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!clientId) return
    window.api.clientAccounts.list(clientId).then(data => setAccounts(data as any[]))
  }, [clientId])

  const handleEditAccount = (a: any) => {
    setEditingAccount(a)
    setAccountForm({ service_name: a.service_name, service_url: a.service_url ?? '', username: a.username ?? '', password: a.password ?? '', notes: a.notes ?? '' })
    setShowAccountForm(true)
  }

  const handleSaveAccount = async () => {
    setSaving(true)
    try {
      if (editingAccount) {
        await window.api.clientAccounts.update(editingAccount.id, { ...accountForm, client_id: clientId })
      } else {
        await window.api.clientAccounts.create({ ...accountForm, client_id: clientId })
      }
      const updated = await window.api.clientAccounts.list(clientId)
      setAccounts(updated as any[])
      setShowAccountForm(false)
      setEditingAccount(null)
      setAccountForm({ ...EMPTY_ACCOUNT_FORM })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async (accountId: number) => {
    if (!confirm('Delete this account?')) return
    await window.api.clientAccounts.delete(accountId)
    setAccounts(accounts.filter((a: any) => a.id !== accountId))
  }

  const handleCancelAccountForm = () => {
    setShowAccountForm(false)
    setEditingAccount(null)
    setAccountForm({ ...EMPTY_ACCOUNT_FORM })
  }

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
            <TabsTrigger value="accounts" className="gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Accounts & Access
            </TabsTrigger>
          </TabsList>

          {/* ── Info tab ── */}
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  {client.hospital_preference && (
                    <div className="p-3 rounded-lg bg-accent/50">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Hospital Preference</p>
                      <p className="text-sm font-medium">{client.hospital_preference}</p>
                    </div>
                  )}
                </div>
                {client.notes && (
                  <div className="p-3 rounded-lg bg-accent/50">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm">{client.notes}</p>
                  </div>
                )}
                {client.allergies && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-xs text-red-600 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Allergies
                    </p>
                    <p className="text-sm font-medium text-red-800">{client.allergies}</p>
                  </div>
                )}
                {client.current_medications && (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wider mb-1">Current Medications</p>
                    <p className="text-sm text-blue-900">{client.current_medications}</p>
                  </div>
                )}
                {client.behavioral_notes && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-600 font-medium uppercase tracking-wider mb-1">Behavioral Notes</p>
                    <p className="text-sm text-amber-900">{client.behavioral_notes}</p>
                  </div>
                )}
                {client.emergency_protocol && (
                  <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <p className="text-xs text-orange-600 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Emergency Protocol
                    </p>
                    <p className="text-sm text-orange-900 font-medium">{client.emergency_protocol}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Appointments tab ── */}
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
                    {clientAppointments.map((a: any) => {
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

          {/* ── Contacts tab ── */}
          <TabsContent value="contacts">
            <ClientContactsPanel clientId={clientId} />
          </TabsContent>

          {/* ── Accounts & Access tab ── */}
          <TabsContent value="accounts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-5 w-5 text-amber-500" />
                  Accounts & Access ({accounts.length})
                </CardTitle>
                <Button size="sm" onClick={() => { setEditingAccount(null); setAccountForm({ ...EMPTY_ACCOUNT_FORM }); setShowAccountForm(true) }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Account
                </Button>
              </CardHeader>
              <CardContent>
                {/* Inline form */}
                {showAccountForm && (
                  <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-3">
                    <p className="text-sm font-medium">{editingAccount ? 'Edit Account' : 'New Account'}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        className="px-3 py-1.5 text-sm border rounded-md bg-background col-span-2"
                        placeholder="Service name *"
                        value={accountForm.service_name}
                        onChange={e => setAccountForm(f => ({ ...f, service_name: e.target.value }))}
                      />
                      <input
                        className="px-3 py-1.5 text-sm border rounded-md bg-background col-span-2"
                        placeholder="Service URL (https://...)"
                        value={accountForm.service_url}
                        onChange={e => setAccountForm(f => ({ ...f, service_url: e.target.value }))}
                      />
                      <input
                        className="px-3 py-1.5 text-sm border rounded-md bg-background"
                        placeholder="Username"
                        value={accountForm.username}
                        onChange={e => setAccountForm(f => ({ ...f, username: e.target.value }))}
                      />
                      <input
                        className="px-3 py-1.5 text-sm border rounded-md bg-background"
                        placeholder="Password"
                        type="text"
                        value={accountForm.password}
                        onChange={e => setAccountForm(f => ({ ...f, password: e.target.value }))}
                      />
                      <textarea
                        className="px-3 py-1.5 text-sm border rounded-md bg-background col-span-2 resize-none"
                        placeholder="Notes"
                        rows={2}
                        value={accountForm.notes}
                        onChange={e => setAccountForm(f => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={handleCancelAccountForm}>Cancel</Button>
                      <Button size="sm" onClick={handleSaveAccount} disabled={!accountForm.service_name || saving}>
                        {saving ? 'Saving…' : 'Save'}
                      </Button>
                    </div>
                  </div>
                )}

                {!accounts.length && !showAccountForm ? (
                  <div className="py-10 text-center">
                    <Globe className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No saved accounts for this client.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accounts.map((a: any, i: number) => (
                      <div
                        key={a.id}
                        className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 animate-slide-up"
                        style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Globe className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="font-semibold text-sm">{a.service_name}</p>
                          {a.service_url && (
                            <a href={a.service_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />{a.service_url}
                            </a>
                          )}
                          {a.username && (
                            <p className="text-xs text-muted-foreground">
                              User: <span className="font-mono text-foreground">{a.username}</span>
                            </p>
                          )}
                          {a.password && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              Pass:{' '}
                              <span className="font-mono text-foreground">
                                {showPasswords[a.id] ? a.password : '••••••••'}
                              </span>
                              <button
                                className="ml-1 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPasswords(p => ({ ...p, [a.id]: !p[a.id] }))}
                              >
                                {showPasswords[a.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </button>
                            </p>
                          )}
                          {a.notes && <p className="text-xs text-muted-foreground italic">{a.notes}</p>}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditAccount(a)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteAccount(a.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
