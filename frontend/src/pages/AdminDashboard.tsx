import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import AnalyticsDashboard from '../components/Analytics'
import ThreatDetectionDashboard from '../components/ThreatDetection'
import { 
  Shield, Users, FileText, ArrowLeft, ToggleLeft, ToggleRight, ShieldAlert, CheckCircle2,
  Settings, Key, Lock, Activity, AlertTriangle, Search, Filter, Download, RefreshCw,
  Monitor, Smartphone, Globe, Clock, Ban, UserCheck, UserX, LogOut, Trash2, Edit,
  Calendar, MapPin, Fingerprint, ShieldCheck, Database, Server, Zap, BarChart3, Radar
} from 'lucide-react'

interface User {
  id: number
  username: string
  email: string
  role: string
  enabled: boolean
  createdAt: string
}

interface AuditLog {
  id: number
  action: string
  targetType: string
  targetId: number
  ipAddress: string
  timestamp: string
  details: string
}

interface Session {
  id: number
  userId: number
  token: string
  deviceInfo: string
  ipAddress: string
  createdAt: string
  expiresAt: string
  isActive: boolean
}

interface LoginAttempt {
  id: number
  userId: number
  ipAddress: string
  success: boolean
  timestamp: string
  failureReason: string | null
}

interface RefreshToken {
  id: number
  userId: number
  token: string
  expiresAt: string
  revoked: boolean
  createdAt: string
}

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState<User[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([])
  const [refreshTokens, setRefreshTokens] = useState<RefreshToken[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const fetchAdminData = async () => {
    setLoading(true)
    setError('')
    try {
      const [usersRes, logsRes] = await Promise.all([
        api.get('/admin/users').then(res => res.data),
        api.get('/admin/audit-logs').then(res => res.data)
      ])
      setUsers(usersRes)
      setLogs(logsRes)
    } catch (err: any) {
      setError('Failed to fetch administrator data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    setError('')
    setSuccess('')
    try {
      await api.put(`/admin/users/${userId}/status?enabled=${!currentStatus}`)
      setSuccess('User status updated successfully.')
      fetchAdminData()
    } catch (err: any) {
      setError('Failed to update user status.')
    }
  }

  const handleRoleChange = async (userId: number, newRole: string) => {
    setError('')
    setSuccess('')
    try {
      await api.put(`/admin/users/${userId}/role?role=${newRole}`)
      setSuccess('User role updated successfully.')
      fetchAdminData()
    } catch (err: any) {
      setError('Failed to update user role.')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    setError('')
    setSuccess('')
    try {
      await api.delete(`/admin/users/${userId}`)
      setSuccess('User deleted successfully.')
      fetchAdminData()
    } catch (err: any) {
      setError('Failed to delete user.')
    }
  }

  const handleRevokeSession = async (sessionId: number) => {
    setError('')
    setSuccess('')
    try {
      await api.post(`/admin/sessions/${sessionId}/revoke`)
      setSuccess('Session revoked successfully.')
      fetchAdminData()
    } catch (err: any) {
      setError('Failed to revoke session.')
    }
  }

  const handleRevokeRefreshToken = async (tokenId: number) => {
    setError('')
    setSuccess('')
    try {
      await api.post(`/admin/refresh-tokens/${tokenId}/revoke`)
      setSuccess('Refresh token revoked successfully.')
      fetchAdminData()
    } catch (err: any) {
      setError('Failed to revoke refresh token.')
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    const matchesStatus = statusFilter === 'ALL' || 
                         (statusFilter === 'ACTIVE' && u.enabled) ||
                         (statusFilter === 'DISABLED' && !u.enabled)
    return matchesSearch && matchesRole && matchesStatus
  })

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.enabled).length,
    disabledUsers: users.filter(u => !u.enabled).length,
    adminUsers: users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length,
    totalSessions: sessions.length,
    activeSessions: sessions.filter(s => s.isActive).length,
    failedLogins: loginAttempts.filter(l => !l.success).length,
    activeTokens: refreshTokens.filter(t => !t.revoked).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-slate-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-bold text-xl">AuthCore Admin</h1>
                <p className="text-xs text-muted-foreground">Enterprise Management Console</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <UserCheck className="h-4 w-4" />
                <span>{user?.username}</span>
                <Badge variant="outline">{user?.role}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 p-4 mb-6 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
            <ShieldAlert className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-4 mb-6 text-sm text-green-700 bg-green-50 rounded-lg border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900">
            <CheckCircle2 className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">{stats.activeUsers} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSessions}</div>
              <p className="text-xs text-muted-foreground">{stats.totalSessions} total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failedLogins}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tokens</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeTokens}</div>
              <p className="text-xs text-muted-foreground">Refresh tokens</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-10 lg:w-auto">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="threats">Threats</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="logs">Audit Logs</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics Dashboard
                </CardTitle>
                <CardDescription>Real-time insights and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Threat Detection Tab */}
          <TabsContent value="threats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radar className="h-5 w-5" />
                  Threat Detection
                </CardTitle>
                <CardDescription>Real-time security monitoring and threat analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ThreatDetectionDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchAdminData}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button size="sm">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Roles</SelectItem>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="MODERATOR">Moderator</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="DISABLED">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select value={user.role} onValueChange={(v) => handleRoleChange(user.id, v)}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GUEST">Guest</SelectItem>
                              <SelectItem value="USER">User</SelectItem>
                              <SelectItem value="MODERATOR">Moderator</SelectItem>
                              <SelectItem value="MANAGER">Manager</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.enabled ? "default" : "destructive"}>
                            {user.enabled ? 'Active' : 'Disabled'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(user.id, user.enabled)}
                            >
                              {user.enabled ? <Ban className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Role-Based Access Control</CardTitle>
                <CardDescription>Define roles and their associated permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { role: 'GUEST', color: 'bg-gray-500', permissions: ['View public content'] },
                    { role: 'USER', color: 'bg-blue-500', permissions: ['View profile', 'Change password', 'View own sessions'] },
                    { role: 'MODERATOR', color: 'bg-purple-500', permissions: ['User permissions', 'View audit logs', 'Moderate content'] },
                    { role: 'MANAGER', color: 'bg-orange-500', permissions: ['User management', 'View reports', 'Team management'] },
                    { role: 'ADMIN', color: 'bg-red-500', permissions: ['Full system access', 'User management', 'System configuration'] },
                    { role: 'SUPER_ADMIN', color: 'bg-yellow-600', permissions: ['All admin permissions', 'System settings', 'Security policies'] }
                  ].map((r) => (
                    <Card key={r.role} className="border-2">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${r.color}`} />
                          <CardTitle className="text-lg">{r.role}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Permissions</Label>
                          {r.permissions.map((p) => (
                            <div key={p} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>{p}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Monitor and manage user sessions across devices</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No active sessions
                        </TableCell>
                      </TableRow>
                    ) : (
                      sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.userId}</TableCell>
                          <TableCell>{session.deviceInfo}</TableCell>
                          <TableCell>{session.ipAddress}</TableCell>
                          <TableCell>{new Date(session.createdAt).toLocaleString()}</TableCell>
                          <TableCell>{new Date(session.expiresAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={session.isActive ? "default" : "destructive"}>
                              {session.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeSession(session.id)}
                              disabled={!session.isActive}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tokens Tab */}
          <TabsContent value="tokens" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Refresh Tokens</CardTitle>
                <CardDescription>Manage refresh tokens for automatic session renewal</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Token (truncated)</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refreshTokens.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No refresh tokens
                        </TableCell>
                      </TableRow>
                    ) : (
                      refreshTokens.map((token) => (
                        <TableRow key={token.id}>
                          <TableCell>{token.userId}</TableCell>
                          <TableCell className="font-mono text-xs">{token.token.substring(0, 20)}...</TableCell>
                          <TableCell>{new Date(token.createdAt).toLocaleString()}</TableCell>
                          <TableCell>{new Date(token.expiresAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={token.revoked ? "destructive" : "default"}>
                              {token.revoked ? 'Revoked' : 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeRefreshToken(token.id)}
                              disabled={token.revoked}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Audit Logs</CardTitle>
                    <CardDescription>Complete system activity history</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchAdminData}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No audit logs found</p>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-4 space-y-2 hover:bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            <span className="font-semibold">{log.action}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.details}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{log.ipAddress}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Fingerprint className="h-3 w-3" />
                            <span>{log.targetType} #{log.targetId}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Device Fingerprinting</CardTitle>
                <CardDescription>Monitor and manage registered devices across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Device Name</TableHead>
                      <TableHead>Fingerprint</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Browser</TableHead>
                      <TableHead>First Seen</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>1</TableCell>
                      <TableCell>John's MacBook</TableCell>
                      <TableCell className="font-mono text-xs">fp_7a8b9c...</TableCell>
                      <TableCell>macOS</TableCell>
                      <TableCell>Chrome</TableCell>
                      <TableCell>2024-01-15</TableCell>
                      <TableCell>2 hours ago</TableCell>
                      <TableCell>
                        <Badge variant="default">Trusted</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Ban className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>2</TableCell>
                      <TableCell>Jane's iPhone</TableCell>
                      <TableCell className="font-mono text-xs">fp_3d4e5f...</TableCell>
                      <TableCell>iOS</TableCell>
                      <TableCell>Safari</TableCell>
                      <TableCell>2024-01-20</TableCell>
                      <TableCell>1 day ago</TableCell>
                      <TableCell>
                        <Badge variant="default">Trusted</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Ban className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>3</TableCell>
                      <TableCell>Unknown Device</TableCell>
                      <TableCell className="font-mono text-xs">fp_1a2b3c...</TableCell>
                      <TableCell>Windows</TableCell>
                      <TableCell>Firefox</TableCell>
                      <TableCell>2024-01-25</TableCell>
                      <TableCell>5 hours ago</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Suspicious</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Ban className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geolocation Tracking</CardTitle>
                <CardDescription>Monitor login locations and detect suspicious activity</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Risk Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>john_doe</TableCell>
                      <TableCell>New York, USA</TableCell>
                      <TableCell>192.168.1.1</TableCell>
                      <TableCell>United States</TableCell>
                      <TableCell>New York</TableCell>
                      <TableCell>2 hours ago</TableCell>
                      <TableCell>
                        <Badge variant="default">Low</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>jane_smith</TableCell>
                      <TableCell>London, UK</TableCell>
                      <TableCell>10.0.0.1</TableCell>
                      <TableCell>United Kingdom</TableCell>
                      <TableCell>London</TableCell>
                      <TableCell>1 day ago</TableCell>
                      <TableCell>
                        <Badge variant="default">Low</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>bob_wilson</TableCell>
                      <TableCell>Moscow, RU</TableCell>
                      <TableCell>172.16.0.1</TableCell>
                      <TableCell>Russia</TableCell>
                      <TableCell>Moscow</TableCell>
                      <TableCell>3 hours ago</TableCell>
                      <TableCell>
                        <Badge variant="destructive">High</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Reports</CardTitle>
                <CardDescription>Generate and view comprehensive security analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className=" grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">User Activity Report</CardTitle>
                      <CardDescription>Daily user login and activity patterns</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">Generate Report</Button>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Security Incident Report</CardTitle>
                      <CardDescription>Failed logins, suspicious activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">Generate Report</Button>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Compliance Report</CardTitle>
                      <CardDescription>GDPR, SOC2, and other compliance metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">Generate Report</Button>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Session Analytics</CardTitle>
                      <CardDescription>Session duration and usage patterns</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">Generate Report</Button>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Password Health Report</CardTitle>
                      <CardDescription>Password strength and reuse analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">Generate Report</Button>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">API Usage Report</CardTitle>
                      <CardDescription>API endpoint performance and usage</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">Generate Report</Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Rate Limiting Configuration</CardTitle>
                <CardDescription>Configure rate limits for API endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Rate Limit</TableHead>
                      <TableHead>Window</TableHead>
                      <TableHead>Current Usage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>/api/users/login</TableCell>
                      <TableCell>10 requests</TableCell>
                      <TableCell>1 minute</TableCell>
                      <TableCell>3/10</TableCell>
                      <TableCell>
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>/api/users/register</TableCell>
                      <TableCell>5 requests</TableCell>
                      <TableCell>1 hour</TableCell>
                      <TableCell>1/5</TableCell>
                      <TableCell>
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>/api/admin/*</TableCell>
                      <TableCell>100 requests</TableCell>
                      <TableCell>1 minute</TableCell>
                      <TableCell>45/100</TableCell>
                      <TableCell>
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Security Policies
                  </CardTitle>
                  <CardDescription>Configure password and session security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Password Minimum Length</Label>
                    <Input type="number" defaultValue={8} />
                  </div>
                  <div className="space-y-2">
                    <Label>Password History Limit</Label>
                    <Input type="number" defaultValue={5} />
                  </div>
                  <div className="space-y-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Input type="number" defaultValue={30} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Failed Login Attempts</Label>
                    <Input type="number" defaultValue={5} />
                  </div>
                  <Button>Save Security Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Account Lockout
                  </CardTitle>
                  <CardDescription>Configure automatic account lockout settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Account Lockout</Label>
                    <Button variant="outline" size="sm">
                      <ToggleRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Lockout Duration (minutes)</Label>
                    <Input type="number" defaultValue={30} />
                  </div>
                  <div className="space-y-2">
                    <Label>Auto-unlock After</Label>
                    <Input type="number" defaultValue={60} />
                  </div>
                  <Button>Save Lockout Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Retention
                  </CardTitle>
                  <CardDescription>Configure audit log and session data retention</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Audit Log Retention (days)</Label>
                    <Input type="number" defaultValue={90} />
                  </div>
                  <div className="space-y-2">
                    <Label>Login History Retention (days)</Label>
                    <Input type="number" defaultValue={30} />
                  </div>
                  <div className="space-y-2">
                    <Label>Session Data Retention (days)</Label>
                    <Input type="number" defaultValue={7} />
                  </div>
                  <Button>Save Retention Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    System Configuration
                  </CardTitle>
                  <CardDescription>General system settings and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>JWT Secret Key</Label>
                    <Input type="password" defaultValue="••••••••••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label>JWT Expiration (minutes)</Label>
                    <Input type="number" defaultValue={15} />
                  </div>
                  <div className="space-y-2">
                    <Label>Refresh Token Expiration (days)</Label>
                    <Input type="number" defaultValue={7} />
                  </div>
                  <Button>Save System Settings</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default AdminDashboard
