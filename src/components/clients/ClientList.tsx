import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { TopBar } from '../layout/TopBar'
import { ToastContainer } from '../layout/ToastContainer'
import { ClientForm } from './ClientForm'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { useApi, useToast } from '../../hooks/useApi'
import type { Client } from '../../types'

const avatarGradients = [
  'gradient-sky', 'gradient-emerald', 'gradient-violet',
  'gradient-indigo', 'gradient-rose', 'gradient-amber',
]

export function ClientList() {
  const { data: clients, loading, refresh } = useApi(() => window.api.clients.list())
  const { data: houses } = useApi(() => window.api.houses.list())
  const { toasts, toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [houseFilter, setHouseFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filtered = clients?.filter(c => {
    const matchesHouse = houseFilter === 'all' || c.house_id?.toString() === houseFilter
    const matchesSearch = `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
    return matchesHouse && matchesSearch
  }) || []

  const getHouseName = (houseId: number | null) => {
    if (!houseId || !houses) return null
    return houses.find(h => h.id === houseId)?.name
  }

  const handleDelete = async (c: Client) => {
    if (!confirm(`Delete ${c.first_name} ${c.last_name}?`)) return
    try {
      await window.api.clients.delete(c.id)
      toast('Client deleted')
      refresh()
    } catch {
      toast('Failed to delete', 'error')
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Clients">
        <Button
          onClick={() => { setEditClient(null); setFormOpen(true) }}
          className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-md shadow-indigo-500/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </TopBar>

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={houseFilter} onValueChange={setHouseFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by house" />
            </SelectTrigger>
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
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl gradient-sky flex items-center justify-center mb-6 shadow-xl shadow-sky-500/20">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {search || houseFilter !== 'all' ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {search || houseFilter !== 'all' ? 'Try adjusting your filters.' : 'Add your first client to get started.'}
            </p>
            {!search && houseFilter === 'all' && (
              <Button onClick={() => { setEditClient(null); setFormOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Client
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c, i) => (
              <Card
                key={c.id}
                className="card-hover cursor-pointer overflow-hidden animate-slide-up"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
                onClick={() => navigate(`/clients/${c.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-xl ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center flex-shrink-0 shadow-md`}>
                        <span className="text-sm font-bold text-white">{c.first_name[0]}{c.last_name[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{c.first_name} {c.last_name}</h3>
                        {c.house_id && (
                          <Badge variant="secondary" className="mt-1 text-xs">{getHouseName(c.house_id)}</Badge>
                        )}
                        {c.phone && <p className="text-sm text-muted-foreground mt-1.5">{c.phone}</p>}
                      </div>
                    </div>
                    <div className="flex gap-0.5 ml-2" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600" onClick={() => { setEditClient(c); setFormOpen(true) }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(c)}>
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

      <ClientForm open={formOpen} onOpenChange={setFormOpen} client={editClient} houses={houses || []} onSave={refresh} toast={toast} />
      <ToastContainer toasts={toasts} />
    </div>
  )
}
