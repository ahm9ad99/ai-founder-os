'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search } from 'lucide-react'

const mockLogs = [
  { id: 1, user: 'Alex Johnson', action: 'AGENT_CREATED', resource: 'agent', details: 'Created "Code Helper" agent', time: '2m ago', ip: '192.168.1.1' },
  { id: 2, user: 'Sarah Chen', action: 'REVIEW_COMPLETED', resource: 'code_review', details: 'Reviewed PR #42', time: '15m ago', ip: '192.168.1.2' },
  { id: 3, user: 'System', action: 'TICKET_ASSIGNED', resource: 'ticket', details: 'Assigned TK-004 to Mike', time: '1h ago', ip: '—' },
  { id: 4, user: 'Alex Johnson', action: 'SUBSCRIPTION_UPDATED', resource: 'subscription', details: 'Upgraded to Pro plan', time: '3h ago', ip: '192.168.1.1' },
  { id: 5, user: 'Mike Torres', action: 'API_KEY_GENERATED', resource: 'api_key', details: 'Generated "Staging Key"', time: '5h ago', ip: '192.168.1.3' },
  { id: 6, user: 'Emily Davis', action: 'INVITATION_SENT', resource: 'team', details: 'Invited user@company.com', time: '1d ago', ip: '192.168.1.4' },
]

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Track all activities in your organization</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle className="text-sm font-medium">Activity Log</CardTitle>
            <div className="relative ml-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search logs..." className="w-64 pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground">{log.time}</TableCell>
                  <TableCell className="text-sm">{log.user}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.details}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.ip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
