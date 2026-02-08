import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Mail, Phone, Search, UserCog, MessageSquare } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { TopBar } from '../layout/TopBar'
import { ToastContainer } from '../layout/ToastContainer'
import { StaffForm } from './StaffForm'
import { useApi, useToast } from '../../hooks/useApi'
import type { Staff } from '../../types'

const avatarGradients = [
  'gradient-indigo', 'gradient-emerald', 'gradient-violet',
  'gradient-amber', 'gradient-rose', 'gradient-sky',
]

export function StaffList() {
  const navigate = useNavigate()
  const { data: staffList, loading, refresh } = useApi(() => window.api.staff.list())
  const { data: houses } = useApi(() => window.api.houses.list())
  const { toasts, toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editStaff, setEditStaff] = useState<Staff | null>(null)
  const [search, setSearch] = useState('')

  const filtered = staffList?.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    s.role?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  ) || []

  const handleDelete = async (s: Staff) => {
    if (!confirm(`Delete ${s.first_name} ${s.last_name}?`)) return
    try {
      await window.api.staff.delete(s.id)
      toast('Staff deleted')
      refresh()
    } catch {
      toast('Failed to delete', 'error')
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Staff">
        <Button
          onClick={() => { setEditStaff(null); setFormOpen(true) }}
          className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-md shadow-indigo-500/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </TopBar>

      <div className="p-6 space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl gradient-violet flex items-center justify-center mb-6 shadow-xl shadow-violet-500/20">
              <UserCog className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {search ? 'No staff found' : 'Build your team'}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {search ? 'Try a different search term.' : 'Add your first staff member to get started.'}
            </p>
            {!search && (
              <Button onClick={() => { setEditStaff(null); setFormOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Staff Member
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s, i) => (
              <Card
                key={s.id}
                className="card-hover overflow-hidden animate-slide-up cursor-pointer"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
                onClick={() => navigate(`/staff/${s.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-xl ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center flex-shrink-0 shadow-md`}>
                        <span className="text-sm font-bold text-white">{s.first_name[0]}{s.last_name[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{s.first_name} {s.last_name}</h3>
                        {s.role && (
                          <Badge variant="secondary" className="mt-1 text-xs font-medium">
                            {s.role}
                          </Badge>
                        )}
                        {s.email && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2">
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{s.email}</span>
                          </p>
                        )}
                        {s.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                            {s.phone}
                            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-indigo-50 hover:text-indigo-600" onClick={(e) => { e.stopPropagation(); navigate(`/messaging?phone=${encodeURIComponent(s.phone!)}&name=${encodeURIComponent(`${s.first_name} ${s.last_name}`)}`) }} title="Send SMS">
                              <MessageSquare className="h-3 w-3" />
                            </Button>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-0.5 ml-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600" onClick={(e) => { e.stopPropagation(); setEditStaff(s); setFormOpen(true) }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(s) }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <StaffForm open={formOpen} onOpenChange={setFormOpen} staff={editStaff} houses={houses || []} onSave={refresh} toast={toast} />
      <ToastContainer toasts={toasts} />
    </div>
  )
}
