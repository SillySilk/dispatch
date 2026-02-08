import { useState, useMemo } from 'react'
import { Plus, Upload, Pencil, Trash2, MessageSquare, HeartPulse, Phone } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { TopBar } from '../layout/TopBar'
import { ToastContainer } from '../layout/ToastContainer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { useApi, useToast } from '../../hooks/useApi'
import { OnCallForm } from './OnCallForm'
import { OnCallBulkImport } from './OnCallBulkImport'
import type { OnCallNurse } from '../../types'
import { useNavigate } from 'react-router-dom'

function isCurrentWeek(startDate: string, endDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return today >= startDate && today <= endDate
}

function isPast(endDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return endDate < today
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${s.toLocaleDateString(undefined, opts)} - ${e.toLocaleDateString(undefined, opts)}`
}

export function OnCallSchedulePage() {
  const navigate = useNavigate()
  const { data: entries, loading, refresh } = useApi(() => window.api.oncall.list())
  const { data: houses } = useApi(() => window.api.houses.list())
  const { toasts, toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<OnCallNurse | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [houseFilter, setHouseFilter] = useState('all')

  const filtered = useMemo(() => {
    let list = entries || []
    if (houseFilter !== 'all') list = list.filter(e => e.house_id.toString() === houseFilter)
    return list
  }, [entries, houseFilter])

  const handleDelete = async (entry: OnCallNurse) => {
    if (!confirm(`Delete on-call assignment for ${entry.nurse_name}?`)) return
    try {
      await window.api.oncall.delete(entry.id)
      toast('Assignment deleted')
      refresh()
    } catch {
      toast('Failed to delete', 'error')
    }
  }

  const handleTextNurse = (entry: OnCallNurse) => {
    if (!entry.nurse_phone) return
    navigate(`/messaging?phone=${encodeURIComponent(entry.nurse_phone)}&name=${encodeURIComponent(entry.nurse_name)}`)
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="On-Call Nurses">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button
            onClick={() => { setEditEntry(null); setFormOpen(true) }}
            className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-md shadow-indigo-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Assignment
          </Button>
        </div>
      </TopBar>

      <div className="p-6 space-y-4 flex-1">
        {/* Filters */}
        <div className="flex gap-3 items-center">
          <Select value={houseFilter} onValueChange={setHouseFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="House" /></SelectTrigger>
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
            <div className="w-20 h-20 rounded-2xl gradient-indigo flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20">
              <HeartPulse className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No on-call assignments</h3>
            <p className="text-muted-foreground text-sm mb-6">Add assignments or bulk import a monthly schedule.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((entry, i) => {
              const current = isCurrentWeek(entry.start_date, entry.end_date)
              const past = isPast(entry.end_date)
              return (
                <Card
                  key={entry.id}
                  className={`overflow-hidden animate-slide-up ${current ? 'ring-2 ring-indigo-400' : ''} ${past ? 'opacity-50' : ''}`}
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
                >
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className={`w-1 flex-shrink-0 ${current ? 'bg-indigo-500' : past ? 'bg-gray-300' : 'bg-emerald-400'}`} />
                      <div className="flex-1 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center w-28 flex-shrink-0">
                            <p className={`text-xs font-semibold ${current ? 'text-indigo-600' : 'text-muted-foreground'}`}>
                              {formatDateRange(entry.start_date, entry.end_date)}
                            </p>
                            {current && (
                              <Badge className="mt-1 text-[10px] bg-indigo-100 text-indigo-700 border-indigo-200">Current</Badge>
                            )}
                          </div>
                          <div className="w-px h-10 bg-border" />
                          <div>
                            <h3 className="font-semibold text-sm">{entry.nurse_name}</h3>
                            <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                              <span>{entry.house_name}</span>
                              {entry.nurse_phone && (
                                <span className="flex items-center gap-0.5">
                                  <Phone className="h-3 w-3" />
                                  {entry.nurse_phone}
                                </span>
                              )}
                              {entry.staff_id && <Badge variant="outline" className="text-[10px] py-0">Staff</Badge>}
                            </div>
                            {entry.notes && (
                              <p className="text-xs text-muted-foreground mt-0.5 italic">{entry.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {entry.nurse_phone && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600"
                              onClick={() => handleTextNurse(entry)}
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600"
                            onClick={() => { setEditEntry(entry); setFormOpen(true) }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDelete(entry)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <OnCallForm open={formOpen} onOpenChange={setFormOpen} entry={editEntry} onSave={refresh} toast={toast} />
      <OnCallBulkImport open={bulkOpen} onOpenChange={setBulkOpen} onSave={refresh} toast={toast} />
      <ToastContainer toasts={toasts} />
    </div>
  )
}
