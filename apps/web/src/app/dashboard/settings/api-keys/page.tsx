'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Key, Copy, Trash2, Plus } from 'lucide-react'

const mockApiKeys = [
  { id: 1, name: 'Production API Key', key: 'af_api_...a1b2c3d4', created: 'Jun 1, 2026', lastUsed: '2h ago', status: 'active' },
  { id: 2, name: 'Development Key', key: 'af_api_...e5f6g7h8', created: 'May 15, 2026', lastUsed: '1d ago', status: 'active' },
  { id: 3, name: 'Staging Key', key: 'af_api_...i9j0k1l2', created: 'Apr 20, 2026', lastUsed: 'Never', status: 'revoked' },
]

export default function ApiKeysPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
          <p className="text-sm text-muted-foreground">Manage API keys for programmatic access</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Generate Key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>Keys are used to authenticate API requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockApiKeys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">{apiKey.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono">{apiKey.key}</code>
                  </TableCell>
                  <TableCell className="text-xs">{apiKey.created}</TableCell>
                  <TableCell className="text-xs">{apiKey.lastUsed}</TableCell>
                  <TableCell>
                    <Badge variant={apiKey.status === 'active' ? 'success' : 'secondary'}>
                      {apiKey.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
