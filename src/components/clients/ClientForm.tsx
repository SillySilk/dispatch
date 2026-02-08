import { useState, useEffect } from 'react'
import { Users, Phone, Mail, AlertCircle, Calendar, FileText } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import type { Client, House } from '../../types'

interface ClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
  houses: House[]
  onSave: () => void
  toast: (msg: string, type?: 'success' | 'error') => void
}

export function ClientForm({ open, onOpenChange, client, houses, onSave, toast }: ClientFormProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [houseId, setHouseId] = useState<string>('')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (client && open) {
      setFirstName(client.first_name)
      setLastName(client.last_name)
      setHouseId(client.house_id?.toString() || '')
      setDob(client.dob || '')
      setPhone(client.phone || '')
      setEmail(client.email || '')
      setEmergencyContact(client.emergency_contact || '')
      setNotes(client.notes || '')
    } else if (open) {
      setFirstName('')
      setLastName('')
      setHouseId('')
      setDob('')
      setPhone('')
      setEmail('')
      setEmergencyContact('')
      setNotes('')
    }
  }, [client, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      toast('First and last name are required', 'error')
      return
    }

    setSaving(true)
    try {
      const data = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        house_id: houseId ? Number(houseId) : null,
        dob: dob || null,
        phone: phone || null,
        email: email || null,
        emergency_contact: emergencyContact || null,
        notes: notes || null,
      }
      if (client) {
        await window.api.clients.update(client.id, data)
        toast('Client updated')
      } else {
        await window.api.clients.create(data)
        toast('Client created')
      }
      onSave()
      onOpenChange(false)
    } catch {
      toast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden p-0">
        <div className="h-1.5 gradient-sky" />
        <div className="p-6 max-h-[calc(90vh-6px)] overflow-y-auto">
          <DialogHeader className="mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-sky flex items-center justify-center shadow-md shadow-sky-500/20">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">{client ? 'Edit Client' : 'Add Client'}</DialogTitle>
                <DialogDescription className="mt-0.5">
                  {client ? 'Update client details.' : 'Add a new client.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Name *</Label>
                <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Name *</Label>
                <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">House</Label>
              <Select value={houseId} onValueChange={setHouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a house" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No house</SelectItem>
                  {houses.map(h => (
                    <SelectItem key={h.id} value={h.id.toString()}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date of Birth</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="dob" type="date" value={dob} onChange={e => setDob(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientPhone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="clientPhone" value={phone} onChange={e => setPhone(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="clientEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Emergency Contact</Label>
              <div className="relative">
                <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="emergency" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} placeholder="Name and phone" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientNotes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</Label>
              <Textarea id="clientNotes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-sky-600 to-sky-500 shadow-md shadow-sky-500/20">
                {saving ? 'Saving...' : client ? 'Update Client' : 'Add Client'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
