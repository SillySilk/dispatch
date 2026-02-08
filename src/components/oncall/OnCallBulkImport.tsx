import { useState, useEffect, useMemo } from 'react'
import { Button } from '../ui/button'
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
import type { House } from '../../types'

interface ParsedRow {
  startDate: string
  endDate: string
  name: string
  phone: string
}

interface OnCallBulkImportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
  toast: (msg: string, type?: 'success' | 'error') => void
}

function parseLines(text: string): ParsedRow[] {
  const rows: ParsedRow[] = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Try pattern: MM/DD - MM/DD  Name  Phone
    const match = trimmed.match(
      /^(\d{1,2}\/\d{1,2})\s*-\s*(\d{1,2}\/\d{1,2})\s+(.+?)\s{2,}([\d\-().+ ]+)$/
    )
    if (match) {
      const year = new Date().getFullYear()
      const [, start, end, name, phone] = match
      const [sm, sd] = start.split('/')
      const [em, ed] = end.split('/')
      rows.push({
        startDate: `${year}-${sm.padStart(2, '0')}-${sd.padStart(2, '0')}`,
        endDate: `${year}-${em.padStart(2, '0')}-${ed.padStart(2, '0')}`,
        name: name.trim(),
        phone: phone.trim(),
      })
      continue
    }

    // Try tab-separated: startDate\tendDate\tname\tphone
    const parts = trimmed.split('\t')
    if (parts.length >= 3) {
      rows.push({
        startDate: parts[0].trim(),
        endDate: parts[1].trim(),
        name: parts[2].trim(),
        phone: parts[3]?.trim() || '',
      })
    }
  }
  return rows
}

export function OnCallBulkImport({ open, onOpenChange, onSave, toast }: OnCallBulkImportProps) {
  const [houseId, setHouseId] = useState<string>('')
  const [rawText, setRawText] = useState('')
  const [houses, setHouses] = useState<House[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      window.api.houses.list().then(setHouses).catch(() => {})
      setRawText('')
      setHouseId('')
    }
  }, [open])

  const parsed = useMemo(() => parseLines(rawText), [rawText])

  const handleImport = async () => {
    if (!houseId || !parsed.length) return
    setSaving(true)
    try {
      const rows = parsed.map(r => ({
        house_id: Number(houseId),
        external_name: r.name,
        external_phone: r.phone || null,
        start_date: r.startDate,
        end_date: r.endDate,
        notes: null,
      }))
      await window.api.oncall.bulkCreate(rows)
      toast(`Imported ${rows.length} assignment${rows.length > 1 ? 's' : ''}`)
      onOpenChange(false)
      onSave()
    } catch {
      toast('Import failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 max-w-lg">
        <div className="h-1.5 gradient-indigo" />
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle>Bulk Import On-Call Schedule</DialogTitle>
            <DialogDescription>Paste a monthly schedule. All imported nurses are added as external — link to staff via edit after.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>House</Label>
              <Select value={houseId} onValueChange={setHouseId}>
                <SelectTrigger><SelectValue placeholder="Select house..." /></SelectTrigger>
                <SelectContent>
                  {houses.map(h => (
                    <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Paste Schedule</Label>
              <Textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder={"01/06 - 01/12  Jane Smith  555-123-4567\n01/13 - 01/19  Bob Jones   555-987-6543"}
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            {parsed.length > 0 && (
              <div>
                <Label className="mb-2 block">Preview ({parsed.length} rows)</Label>
                <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-accent/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Start</th>
                        <th className="px-3 py-2 text-left font-semibold">End</th>
                        <th className="px-3 py-2 text-left font-semibold">Name</th>
                        <th className="px-3 py-2 text-left font-semibold">Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.map((r, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-1.5">{r.startDate}</td>
                          <td className="px-3 py-1.5">{r.endDate}</td>
                          <td className="px-3 py-1.5">{r.name}</td>
                          <td className="px-3 py-1.5">{r.phone || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={handleImport}
              disabled={saving || !houseId || !parsed.length}
              className="bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-md shadow-indigo-500/20"
            >
              {saving ? 'Importing...' : `Import ${parsed.length} Row${parsed.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
