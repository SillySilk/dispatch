import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, MessageSquare, Mail, MapPin, BookUser } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useApi, useToast } from '../../hooks/useApi'
import { ToastContainer } from '../layout/ToastContainer'
import type { ClientContact } from '../../types'

interface Props {
  clientId: number
}

const CATEGORIES = [
  { value: 'pharmacy', label: 'Pharmacy', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'medical', label: 'Medical', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'community', label: 'Community', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { value: 'personal', label: 'Personal', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'other', label: 'Other', color: 'bg-slate-50 text-slate-700 border-slate-200' },
]

function categoryBadge(category: string) {
  const cat = CATEGORIES.find(c => c.value === category) || CATEGORIES[4]
  return <Badge className={`text-xs border ${cat.color}`}>{cat.label}</Badge>
}

export function ClientContactsPanel({ clientId }: Props) {
  const navigate = useNavigate()
  const { toasts, toast } = useToast()
  const { data: contacts, refresh } = useApi(
    () => window.api.clientContacts.list(clientId),
    [clientId]
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editContact, setEditContact] = useState<ClientContact | null>(null)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('other')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  const openAdd = () => {
    setEditContact(null)
    setName('')
    setCategory('other')
    setPhone('')
    setEmail('')
    setAddress('')
    setNotes('')
    setFormOpen(true)
  }

  const openEdit = (c: ClientContact) => {
    setEditContact(c)
    setName(c.name)
    setCategory(c.category)
    setPhone(c.phone || '')
    setEmail(c.email || '')
    setAddress(c.address || '')
    setNotes(c.notes || '')
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast('Name is required', 'error')
      return
    }
    try {
      if (editContact) {
        await window.api.clientContacts.update(editContact.id, {
          name, category,
          phone: phone || undefined,
          email: email || undefined,
          address: address || undefined,
          notes: notes || undefined,
        })
        toast('Contact updated')
      } else {
        await window.api.clientContacts.create({
          client_id: clientId,
          name, category,
          phone: phone || undefined,
          email: email || undefined,
          address: address || undefined,
          notes: notes || undefined,
        })
        toast('Contact added')
      }
      setFormOpen(false)
      refresh()
    } catch {
      toast('Failed to save', 'error')
    }
  }

  const handleDelete = async (c: ClientContact) => {
    if (!confirm(`Delete "${c.name}"?`)) return
    try {
      await window.api.clientContacts.delete(c.id)
      toast('Contact deleted')
      refresh()
    } catch {
      toast('Failed to delete', 'error')
    }
  }

  const handleSms = (contactPhone: string, contactName: string) => {
    navigate(`/messaging?phone=${encodeURIComponent(contactPhone)}&name=${encodeURIComponent(contactName)}`)
  }

  const handleEmail = (contactEmail: string) => {
    window.open(`mailto:${contactEmail}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Contacts & Places</h3>
        <Button size="sm" onClick={openAdd} className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-md shadow-indigo-500/20">
          <Plus className="h-4 w-4 mr-1" />
          Add Contact
        </Button>
      </div>

      {!contacts?.length ? (
        <div className="py-10 text-center">
          <BookUser className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No contacts or places saved for this client.</p>
          <p className="text-xs text-muted-foreground mt-1">Add pharmacies, doctors, community services, and more.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c, i) => (
            <Card
              key={c.id}
              className="overflow-hidden animate-slide-up"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
            >
              <CardContent className="p-0">
                <div className="flex">
                  <div className={`w-1 flex-shrink-0 ${
                    c.category === 'pharmacy' ? 'bg-emerald-400' :
                    c.category === 'medical' ? 'bg-sky-400' :
                    c.category === 'community' ? 'bg-violet-400' :
                    c.category === 'personal' ? 'bg-amber-400' : 'bg-slate-400'
                  }`} />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{c.name}</span>
                          {categoryBadge(c.category)}
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{c.phone}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-indigo-50 hover:text-indigo-600"
                              onClick={() => handleSms(c.phone!, c.name)}
                              title="Send SMS"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{c.email}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-indigo-50 hover:text-indigo-600"
                              onClick={() => handleEmail(c.email!)}
                              title="Send Email"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                        {c.address && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            {c.address}
                          </p>
                        )}
                        {c.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-0.5 ml-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(c)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="overflow-hidden p-0">
          <div className="h-1.5 gradient-indigo" />
          <div className="p-6">
            <DialogHeader className="mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-indigo flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <BookUser className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg">{editContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
                  <DialogDescription className="mt-0.5">Save a contact or place for this client.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., CVS Pharmacy, Dr. Smith" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Address</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, City, State" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional details" />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-md shadow-indigo-500/20">
                {editContact ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <ToastContainer toasts={toasts} />
    </div>
  )
}
