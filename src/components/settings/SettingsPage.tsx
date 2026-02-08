import { useState, useEffect } from 'react'
import { Mail, MessageSquare, Bell, Database, Send, Shield, UploadCloud, AlertTriangle } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { TopBar } from '../layout/TopBar'
import { ToastContainer } from '../layout/ToastContainer'
import { useToast } from '../../hooks/useApi'

export function SettingsPage() {
  const { toasts, toast } = useToast()

  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('587')
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [smtpFrom, setSmtpFrom] = useState('')
  const [smtpSecure, setSmtpSecure] = useState(false)
  const [testEmail, setTestEmail] = useState('')

  const [twilioSid, setTwilioSid] = useState('')
  const [twilioToken, setTwilioToken] = useState('')
  const [twilioFrom, setTwilioFrom] = useState('')
  const [testPhone, setTestPhone] = useState('')

  const [reminderMinutes, setReminderMinutes] = useState('30')

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    try {
      const smtpConfig = await window.api.settings.get('smtp_config')
      if (smtpConfig) {
        const cfg = JSON.parse(smtpConfig)
        setSmtpHost(cfg.host || ''); setSmtpPort(cfg.port?.toString() || '587')
        setSmtpUser(cfg.user || ''); setSmtpFrom(cfg.from || ''); setSmtpSecure(cfg.secure || false)
      }
      const twilioConfig = await window.api.settings.get('twilio_config')
      if (twilioConfig) {
        const cfg = JSON.parse(twilioConfig)
        setTwilioSid(cfg.accountSid || ''); setTwilioFrom(cfg.fromNumber || '')
      }
      const rm = await window.api.settings.get('reminder_minutes')
      if (rm) setReminderMinutes(rm)
    } catch {}
  }

  const saveSmtp = async () => {
    try {
      await window.api.settings.set('smtp_config', JSON.stringify({ host: smtpHost, port: parseInt(smtpPort), secure: smtpSecure, user: smtpUser, from: smtpFrom }))
      if (smtpPass) await window.api.settings.set('smtp_password', smtpPass, true)
      toast('SMTP settings saved')
    } catch { toast('Failed to save', 'error') }
  }

  const saveTwilio = async () => {
    try {
      await window.api.settings.set('twilio_config', JSON.stringify({ accountSid: twilioSid, fromNumber: twilioFrom }))
      if (twilioToken) await window.api.settings.set('twilio_auth_token', twilioToken, true)
      toast('Twilio settings saved')
    } catch { toast('Failed to save', 'error') }
  }

  const saveReminder = async () => {
    try { await window.api.settings.set('reminder_minutes', reminderMinutes); toast('Reminder settings saved') }
    catch { toast('Failed to save', 'error') }
  }

  const handleTestEmail = async () => {
    if (!testEmail) { toast('Enter a test email address', 'error'); return }
    toast('Sending test email...')
    const r = await window.api.notifications.sendTestEmail(testEmail)
    r.success ? toast('Test email sent!') : toast(`Failed: ${r.error}`, 'error')
  }

  const handleTestSms = async () => {
    if (!testPhone) { toast('Enter a test phone number', 'error'); return }
    toast('Sending test SMS...')
    const r = await window.api.notifications.sendTestSms(testPhone)
    r.success ? toast('Test SMS sent!') : toast(`Failed: ${r.error}`, 'error')
  }

  const handleBackup = async () => {
    const r = await window.api.db.backup()
    if (r.success) toast(`Backup saved to ${r.path}`)
    else if (r.error !== 'Cancelled') toast(`Backup failed: ${r.error}`, 'error')
  }

  const handleRestore = async () => {
    if (!confirm('Are you sure you want to restore the database? A backup of the current database will be created automatically before restoring. The app will reload after restore.')) return
    const r = await window.api.db.restore()
    if (r.success) {
      toast('Database restored. Reloading...')
      setTimeout(() => window.location.reload(), 1500)
    } else if (r.error !== 'Cancelled') {
      toast(`Restore failed: ${r.error}`, 'error')
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Settings" />

      <div className="p-6 animate-fade-in">
        <Tabs defaultValue="smtp">
          <TabsList className="mb-6">
            <TabsTrigger value="smtp" className="gap-1.5"><Mail className="h-3.5 w-3.5" />Email</TabsTrigger>
            <TabsTrigger value="twilio" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" />SMS</TabsTrigger>
            <TabsTrigger value="reminders" className="gap-1.5"><Bell className="h-3.5 w-3.5" />Reminders</TabsTrigger>
            <TabsTrigger value="backup" className="gap-1.5"><Database className="h-3.5 w-3.5" />Backup</TabsTrigger>
          </TabsList>

          <TabsContent value="smtp">
            <Card>
              <div className="h-1 gradient-indigo" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-indigo-500" />
                  SMTP Configuration
                </CardTitle>
                <CardDescription>Configure outgoing email for appointment reminders.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>SMTP Host</Label><Input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" /></div>
                  <div className="space-y-2"><Label>Port</Label><Input value={smtpPort} onChange={e => setSmtpPort(e.target.value)} placeholder="587" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Username</Label><Input value={smtpUser} onChange={e => setSmtpUser(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Password</Label><Input type="password" value={smtpPass} onChange={e => setSmtpPass(e.target.value)} placeholder="Enter to update" /></div>
                </div>
                <div className="space-y-2"><Label>From Address</Label><Input value={smtpFrom} onChange={e => setSmtpFrom(e.target.value)} placeholder="dispatcher@example.com" /></div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={smtpSecure} onChange={e => setSmtpSecure(e.target.checked)} className="rounded" />
                  Use SSL/TLS
                </label>
                <Button onClick={saveSmtp} className="bg-gradient-to-r from-indigo-600 to-indigo-500">Save SMTP Settings</Button>
                <div className="border-t pt-4 mt-4">
                  <Label className="text-muted-foreground">Test Email</Label>
                  <div className="flex gap-2 mt-2">
                    <Input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@example.com" className="max-w-xs" />
                    <Button variant="outline" onClick={handleTestEmail}><Send className="h-3.5 w-3.5 mr-2" />Send Test</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="twilio">
            <Card>
              <div className="h-1 gradient-emerald" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-500" />
                  Twilio Configuration
                </CardTitle>
                <CardDescription>Configure SMS notifications via Twilio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Account SID</Label><Input value={twilioSid} onChange={e => setTwilioSid(e.target.value)} /></div>
                <div className="space-y-2"><Label>Auth Token</Label><Input type="password" value={twilioToken} onChange={e => setTwilioToken(e.target.value)} placeholder="Enter to update" /></div>
                <div className="space-y-2"><Label>From Number</Label><Input value={twilioFrom} onChange={e => setTwilioFrom(e.target.value)} placeholder="+1234567890" /></div>
                <Button onClick={saveTwilio} className="bg-gradient-to-r from-emerald-600 to-emerald-500">Save Twilio Settings</Button>
                <div className="border-t pt-4 mt-4">
                  <Label className="text-muted-foreground">Test SMS</Label>
                  <div className="flex gap-2 mt-2">
                    <Input value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="+1234567890" className="max-w-xs" />
                    <Button variant="outline" onClick={handleTestSms}><Send className="h-3.5 w-3.5 mr-2" />Send Test</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reminders">
            <Card>
              <div className="h-1 gradient-amber" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-500" />
                  Reminder Settings
                </CardTitle>
                <CardDescription>Configure when appointment reminders are sent to staff.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Send reminders (minutes before appointment)</Label>
                  <Input type="number" value={reminderMinutes} onChange={e => setReminderMinutes(e.target.value)} className="max-w-xs" />
                </div>
                <Button onClick={saveReminder} className="bg-gradient-to-r from-amber-600 to-amber-500">Save</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup">
            <div className="space-y-6">
              <Card>
                <div className="h-1 gradient-violet" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-violet-500" />
                    Database Backup
                  </CardTitle>
                  <CardDescription>Export a copy of the database file for safekeeping.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-accent/50 mb-4">
                    <Database className="h-10 w-10 text-violet-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Protect your data</p>
                      <p className="text-xs text-muted-foreground mt-1">Creates a copy of the entire database. Store it in a safe, separate location. Recommended before major changes.</p>
                    </div>
                  </div>
                  <Button onClick={handleBackup} className="bg-gradient-to-r from-violet-600 to-violet-500">
                    <Database className="h-4 w-4 mr-2" />
                    Backup Database
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-400" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UploadCloud className="h-5 w-5 text-amber-500" />
                    Restore Database
                  </CardTitle>
                  <CardDescription>Replace the current database with a previously saved backup.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-amber-50 border border-amber-200 mb-4">
                    <AlertTriangle className="h-10 w-10 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Proceed with caution</p>
                      <p className="text-xs text-muted-foreground mt-1">Restoring will replace all current data with the selected backup file. A safety backup of the current database is created automatically before restoring. The app will reload after a successful restore.</p>
                    </div>
                  </div>
                  <Button onClick={handleRestore} variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                    <UploadCloud className="h-4 w-4 mr-2" />
                    Restore from Backup
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  )
}
