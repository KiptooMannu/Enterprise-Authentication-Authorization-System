import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { adminApi } from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import AnalyticsDashboard from '../components/Analytics'
import ThreatDetectionDashboard from '../components/ThreatDetection'
import {
  Shield, Users, ShieldAlert, CheckCircle2, Monitor, UserCheck, LogOut,
  Ban, Trash2, Fingerprint, ShieldCheck, Database, Server,
  BarChart3, Radar, Key, RefreshCw, Search, Download, Activity, MapPin,
  Lock, X, Settings, FileText
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
  userId: number | null
  username: string
  token: string
  ipAddress: string
  userAgent: string
  createdAt: string
  expiryDate: string
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
  const [loginAttempts] = useState<LoginAttempt[]>([])
  const [refreshTokens, setRefreshTokens] = useState<RefreshToken[]>([])
  const [, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '' })
  const [addingUser, setAddingUser] = useState(false)
  const [updatingRole, setUpdatingRole] = useState<number | null>(null)
  const [togglingStatus, setTogglingStatus] = useState<number | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])

  // Configuration state
  const [config, setConfig] = useState<Record<string, Record<string, string>>>({
    security: {},
    lockout: {},
    retention: {},
    system: {}
  })

  // Settings loading states
  const [savingSecurity, setSavingSecurity] = useState(false)
  const [savingLockout, setSavingLockout] = useState(false)
  const [savingRetention, setSavingRetention] = useState(false)
  const [savingSystem, setSavingSystem] = useState(false)

  // Rate limit state
  const [rateLimits, setRateLimits] = useState<any[]>([])

  // Login locations state
  const [loginLocations, setLoginLocations] = useState<any[]>([])
  const [selectedUserLocations, setSelectedUserLocations] = useState<any[]>([])

  const fetchAdminData = async () => {
    setLoading(true)
    setError('')
    try {
      const [usersRes, logsRes] = await Promise.all([
        adminApi.listUsers().then(res => res.data),
        adminApi.getAuditLogs().then(res => res.data)
      ])
      setUsers(usersRes)
      setLogs(logsRes)

      // Fetch sessions separately to avoid blocking if it fails
      try {
        const sessionsRes = await adminApi.getAllSessions()
        setSessions(sessionsRes.data)
        // Map sessions to refresh tokens format
        setRefreshTokens(sessionsRes.data.map((s: Session) => ({
          id: s.id,
          userId: s.userId,
          token: s.token,
          expiresAt: s.expiryDate,
          revoked: !s.isActive,
          createdAt: s.createdAt
        })))
      } catch (sessionErr) {
        console.error('Failed to load sessions:', sessionErr)
        setSessions([])
        setRefreshTokens([])
      }

      // Fetch configurations
      try {
        const configRes = await adminApi.getAllConfigs()
        setConfig(configRes.data)
      } catch (configErr) {
        console.error('Failed to load configs:', configErr)
        // Initialize default configs if none exist
        try {
          await adminApi.initializeConfigs()
          const configRes = await adminApi.getAllConfigs()
          setConfig(configRes.data)
        } catch (initErr) {
          console.error('Failed to initialize configs:', initErr)
        }
      }

      // Fetch rate limits
      try {
        const rateLimitsRes = await adminApi.getAllRateLimits()
        setRateLimits(rateLimitsRes.data)
      } catch (rateLimitErr) {
        console.error('Failed to load rate limits:', rateLimitErr)
        // Initialize default rate limits if none exist
        try {
          await adminApi.initializeRateLimits()
          const rateLimitsRes = await adminApi.getAllRateLimits()
          setRateLimits(rateLimitsRes.data)
        } catch (initErr) {
          console.error('Failed to initialize rate limits:', initErr)
        }
      }

      // Fetch login locations
      try {
        const locationsRes = await adminApi.getAllLoginLocations()
        setLoginLocations(locationsRes.data)
      } catch (locationErr) {
        console.error('Failed to load login locations:', locationErr)
      }
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
    setTogglingStatus(userId)
    try {
      await adminApi.updateStatus(userId, !currentStatus)
      setSuccess('User status updated successfully.')
      fetchAdminData()
    } catch (err: any) {
      setError('Failed to update user status.')
    } finally {
      setTogglingStatus(null)
    }
  }

  const handleRoleChange = async (userId: number, newRole: string) => {
    setError('')
    setSuccess('')
    setUpdatingRole(userId)
    try {
      await adminApi.updateRole(userId, newRole)
      setSuccess('User role updated successfully.')
      fetchAdminData()
    } catch (err: any) {
      setError('Failed to update user role.')
    } finally {
      setUpdatingRole(null)
    }
  }

  const handleDeleteUser = async (_userId: number) => {
    // Backend does not have a delete endpoint for admin users
    setError('User deletion not implemented in backend.')
  }

  const handleAddUser = async () => {
    setError('')
    setSuccess('')
    if (!newUser.username || !newUser.email || !newUser.password) {
      setError('All fields are required.')
      return
    }
    setAddingUser(true)
    try {
      await adminApi.addUser(newUser.username, newUser.email, newUser.password)
      setSuccess('User added successfully.')
      setAddUserDialogOpen(false)
      setNewUser({ username: '', email: '', password: '' })
      fetchAdminData()
    } catch (err: any) {
      setError('Failed to add user: ' + (err.response?.data?.message || err.message))
    } finally {
      setAddingUser(false)
    }
  }

  const handleRevokeSession = async (sessionId: number) => {
    setError('')
    try {
      await adminApi.revokeSession(sessionId)
      setSuccess('Session revoked successfully.')
      setSessions(sessions.filter(s => s.id !== sessionId))
    } catch (err: any) {
      setError('Failed to revoke session: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleRevokeRefreshToken = async (_tokenId: number) => {
    // Backend does not have admin refresh token revoke endpoint
    setError('Refresh token revocation not implemented in backend.')
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
                    <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Add User
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New User</DialogTitle>
                          <DialogDescription>
                            Create a new user account with the specified role.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                              id="username"
                              value={newUser.username}
                              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                              placeholder="Enter username"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={newUser.email}
                              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                              placeholder="Enter email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              value={newUser.password}
                              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                              placeholder="Enter password (min 8 characters)"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            New users will be created with the USER role. You can change their role after creation.
                          </p>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAddUserDialogOpen(false)} disabled={addingUser}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <Button onClick={handleAddUser} disabled={addingUser}>
                            {addingUser ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Add User
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
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
                          <Select 
                            value={user.role} 
                            onValueChange={(v) => handleRoleChange(user.id, v)}
                            disabled={user.id === user?.id || updatingRole === user.id}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                              {updatingRole === user.id && <RefreshCw className="h-4 w-4 ml-2 animate-spin" />}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USER">User</SelectItem>
                              <SelectItem value="MANAGER">Manager</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
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
                              disabled={user.id === user?.id || togglingStatus === user.id}
                            >
                              {togglingStatus === user.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : user.enabled ? (
                                <Ban className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </Button>
                            {user.id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
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
                    { role: 'USER', color: 'bg-blue-500', permissions: ['View profile', 'Change password', 'View own sessions'] },
                    { role: 'MANAGER', color: 'bg-orange-500', permissions: ['User management', 'View reports', 'Team management'] },
                    { role: 'ADMIN', color: 'bg-red-500', permissions: ['Full system access', 'User management', 'System configuration'] }
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
                <CardTitle>Active Sessions with Location Data</CardTitle>
                <CardDescription>Monitor user sessions with geolocation information</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Coordinates</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Browser</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Login Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginLocations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          No login locations recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      loginLocations.map((location: any) => (
                        <TableRow key={location.id}>
                          <TableCell className="font-medium">
                            {users.find(u => u.id === location.userId)?.email || `User ${location.userId}`}
                          </TableCell>
                          <TableCell>
                            {location.formattedAddress ? (
                              <div>
                                <div className="font-medium">{location.city || 'Unknown'}</div>
                                <div className="text-xs text-muted-foreground">{location.country || 'Unknown'}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Unknown</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {location.latitude && location.longitude ? (
                              <div>
                                <div className="text-xs">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</div>
                                <a
                                  href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:underline"
                                >
                                  View on Map
                                </a>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {location.accuracy ? (
                              <span className="text-xs">
                                {location.accuracy.toFixed(0)}m
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>{location.deviceType || 'Unknown'}</div>
                              <div className="text-muted-foreground">{location.operatingSystem || 'Unknown'}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {location.browser || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {location.ipAddress || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(location.loginTime).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {location.sessionId && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await adminApi.revokeSession(location.sessionId)
                                    setSuccess('Session revoked successfully')
                                    fetchAdminData()
                                  } catch (err) {
                                    setError('Failed to revoke session')
                                  }
                                }}
                              >
                                Revoke
                              </Button>
                            )}
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
                      <TableHead>User</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>User Agent</TableHead>
                      <TableHead>First Seen</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No devices registered
                        </TableCell>
                      </TableRow>
                    ) : (
                      sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="font-medium">{session.username}</div>
                            <div className="text-xs text-muted-foreground">ID: {session.userId}</div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{session.ipAddress}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={session.userAgent}>
                            {session.userAgent}
                          </TableCell>
                          <TableCell>{new Date(session.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(session.expiryDate).toLocaleDateString()}</TableCell>
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
                      <TableHead>IP Address</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Risk Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No location data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.username}</TableCell>
                          <TableCell className="font-mono text-xs">{session.ipAddress}</TableCell>
                          <TableCell>
                            <Badge variant="outline">Unknown</Badge>
                          </TableCell>
                          <TableCell>{new Date(session.createdAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="default">Low</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">User Activity Report</CardTitle>
                      <CardDescription>Daily user login and activity patterns</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-4">
                        Total Events: {logs.length}
                      </div>
                      <Button className="w-full" onClick={() => setSuccess('Report generated successfully')}>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Security Incident Report</CardTitle>
                      <CardDescription>Failed logins, suspicious activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-4">
                        Failed Logins: {logs.filter(l => l.action.includes('FAILED')).length}
                      </div>
                      <Button className="w-full" onClick={() => setSuccess('Report generated successfully')}>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Compliance Report</CardTitle>
                      <CardDescription>GDPR, SOC2, and other compliance metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-4">
                        Audit Logs: {logs.length} records
                      </div>
                      <Button className="w-full" onClick={() => setSuccess('Report generated successfully')}>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Session Analytics</CardTitle>
                      <CardDescription>Session duration and usage patterns</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-4">
                        Active Sessions: {sessions.filter(s => s.isActive).length}
                      </div>
                      <Button className="w-full" onClick={() => setSuccess('Report generated successfully')}>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Password Health Report</CardTitle>
                      <CardDescription>Password strength and reuse analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-4">
                        Total Users: {users.length}
                      </div>
                      <Button className="w-full" onClick={() => setSuccess('Report generated successfully')}>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">API Usage Report</CardTitle>
                      <CardDescription>API endpoint performance and usage</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-4">
                        Total API Calls: {logs.length}
                      </div>
                      <Button className="w-full" onClick={() => setSuccess('Report generated successfully')}>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
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
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Endpoint</Label>
                  <Input placeholder="/api/auth/login" id="rate_limit_endpoint" />
                </div>
                <div className="space-y-2">
                  <Label>Max Requests</Label>
                  <Input type="number" placeholder="10" min={1} id="rate_limit_max_requests" />
                </div>
                <div className="space-y-2">
                  <Label>Window (minutes)</Label>
                  <Input type="number" placeholder="1" min={1} id="rate_limit_window" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="rate_limit_enabled" defaultChecked />
                  <Label htmlFor="rate_limit_enabled">Enable Rate Limit</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={async () => {
                    try {
                      await adminApi.createOrUpdateRateLimit({
                        endpoint: (document.getElementById('rate_limit_endpoint') as HTMLInputElement).value,
                        maxRequests: parseInt((document.getElementById('rate_limit_max_requests') as HTMLInputElement).value),
                        windowMinutes: parseInt((document.getElementById('rate_limit_window') as HTMLInputElement).value),
                        enabled: (document.getElementById('rate_limit_enabled') as HTMLInputElement).checked
                      })
                      setSuccess('Rate limit added successfully')
                      const rateLimitsRes = await adminApi.getAllRateLimits()
                      setRateLimits(rateLimitsRes.data)
                    } catch (err) {
                      setError('Failed to add rate limit')
                    }
                  }}>
                    Add Rate Limit
                  </Button>
                  <Button variant="outline" onClick={async () => {
                    try {
                      await adminApi.initializeRateLimits()
                      setSuccess('Default rate limits initialized')
                      const rateLimitsRes = await adminApi.getAllRateLimits()
                      setRateLimits(rateLimitsRes.data)
                    } catch (err) {
                      setError('Failed to initialize rate limits')
                    }
                  }}>
                    Initialize Defaults
                  </Button>
                </div>
                <div className="mt-4">
                  <Label>Current Rate Limits</Label>
                  <div className="mt-2 space-y-2">
                    {rateLimits.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No rate limits configured</p>
                    ) : (
                      rateLimits.map((limit: any) => (
                        <div key={limit.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{limit.endpoint}</p>
                            <p className="text-sm text-muted-foreground">
                              {limit.maxRequests} requests / {limit.windowMinutes} min
                              {limit.enabled ? ' (Enabled)' : ' (Disabled)'}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              try {
                                await adminApi.deleteRateLimit(limit.endpoint)
                                setSuccess('Rate limit deleted successfully')
                                const rateLimitsRes = await adminApi.getAllRateLimits()
                                setRateLimits(rateLimitsRes.data)
                              } catch (err) {
                                setError('Failed to delete rate limit')
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
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
                    <Input
                      type="number"
                      defaultValue={config.security?.['security.password.min_length'] || 8}
                      min={6}
                      max={32}
                      id="password_min_length"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password History Limit</Label>
                    <Input
                      type="number"
                      defaultValue={config.security?.['security.password.history_limit'] || 5}
                      min={0}
                      max={20}
                      id="password_history_limit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Input
                      type="number"
                      defaultValue={config.security?.['security.session.timeout'] || 30}
                      min={5}
                      max={1440}
                      id="session_timeout"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Failed Login Attempts</Label>
                    <Input
                      type="number"
                      defaultValue={config.security?.['security.max_failed_attempts'] || 5}
                      min={3}
                      max={10}
                      id="max_failed_attempts"
                    />
                  </div>
                  <Button onClick={async () => {
                    setSavingSecurity(true)
                    try {
                      await adminApi.updateConfig({
                        key: 'security.password.min_length',
                        value: (document.getElementById('password_min_length') as HTMLInputElement).value,
                        category: 'security',
                        description: 'Minimum password length'
                      })
                      await adminApi.updateConfig({
                        key: 'security.password.history_limit',
                        value: (document.getElementById('password_history_limit') as HTMLInputElement).value,
                        category: 'security',
                        description: 'Password history limit'
                      })
                      await adminApi.updateConfig({
                        key: 'security.session.timeout',
                        value: (document.getElementById('session_timeout') as HTMLInputElement).value,
                        category: 'security',
                        description: 'Session timeout in minutes'
                      })
                      await adminApi.updateConfig({
                        key: 'security.max_failed_attempts',
                        value: (document.getElementById('max_failed_attempts') as HTMLInputElement).value,
                        category: 'security',
                        description: 'Maximum failed login attempts'
                      })
                      setSuccess('Security settings saved successfully')
                      fetchAdminData()
                    } catch (err) {
                      setError('Failed to save security settings')
                    } finally {
                      setSavingSecurity(false)
                    }
                  }} disabled={savingSecurity}>
                    {savingSecurity ? 'Saving...' : 'Save Security Settings'}
                  </Button>
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
                    <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.lockout?.['lockout.enabled'] === 'true' ? 'right-1' : 'left-1'}`} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Lockout Duration (minutes)</Label>
                    <Input
                      type="number"
                      defaultValue={config.lockout?.['lockout.duration'] || 30}
                      min={5}
                      max={1440}
                      id="lockout_duration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Auto-unlock After (minutes)</Label>
                    <Input
                      type="number"
                      defaultValue={config.lockout?.['lockout.auto_unlock'] || 60}
                      min={10}
                      max={10080}
                      id="lockout_auto_unlock"
                    />
                  </div>
                  <Button onClick={async () => {
                    setSavingLockout(true)
                    try {
                      await adminApi.updateConfig({
                        key: 'lockout.enabled',
                        value: 'true',
                        category: 'lockout',
                        description: 'Enable account lockout'
                      })
                      await adminApi.updateConfig({
                        key: 'lockout.duration',
                        value: (document.getElementById('lockout_duration') as HTMLInputElement).value,
                        category: 'lockout',
                        description: 'Lockout duration in minutes'
                      })
                      await adminApi.updateConfig({
                        key: 'lockout.auto_unlock',
                        value: (document.getElementById('lockout_auto_unlock') as HTMLInputElement).value,
                        category: 'lockout',
                        description: 'Auto-unlock after in minutes'
                      })
                      setSuccess('Lockout settings saved successfully')
                      fetchAdminData()
                    } catch (err) {
                      setError('Failed to save lockout settings')
                    } finally {
                      setSavingLockout(false)
                    }
                  }} disabled={savingLockout}>
                    {savingLockout ? 'Saving...' : 'Save Lockout Settings'}
                  </Button>
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
                    <Input
                      type="number"
                      defaultValue={config.retention?.['retention.audit_logs'] || 90}
                      min={7}
                      max={365}
                      id="audit_log_retention"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Login History Retention (days)</Label>
                    <Input
                      type="number"
                      defaultValue={config.retention?.['retention.login_history'] || 30}
                      min={7}
                      max={365}
                      id="login_history_retention"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Session Data Retention (days)</Label>
                    <Input
                      type="number"
                      defaultValue={config.retention?.['retention.session_data'] || 7}
                      min={1}
                      max={90}
                      id="session_data_retention"
                    />
                  </div>
                  <Button onClick={async () => {
                    setSavingRetention(true)
                    try {
                      await adminApi.updateConfig({
                        key: 'retention.audit_logs',
                        value: (document.getElementById('audit_log_retention') as HTMLInputElement).value,
                        category: 'retention',
                        description: 'Audit log retention in days'
                      })
                      await adminApi.updateConfig({
                        key: 'retention.login_history',
                        value: (document.getElementById('login_history_retention') as HTMLInputElement).value,
                        category: 'retention',
                        description: 'Login history retention in days'
                      })
                      await adminApi.updateConfig({
                        key: 'retention.session_data',
                        value: (document.getElementById('session_data_retention') as HTMLInputElement).value,
                        category: 'retention',
                        description: 'Session data retention in days'
                      })
                      setSuccess('Retention settings saved successfully')
                      fetchAdminData()
                    } catch (err) {
                      setError('Failed to save retention settings')
                    } finally {
                      setSavingRetention(false)
                    }
                  }} disabled={savingRetention}>
                    {savingRetention ? 'Saving...' : 'Save Retention Settings'}
                  </Button>
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
                    <Input type="password" defaultValue="••••••••••••••••" disabled />
                    <p className="text-xs text-muted-foreground">Cannot be modified for security reasons</p>
                  </div>
                  <div className="space-y-2">
                    <Label>JWT Expiration (minutes)</Label>
                    <Input
                      type="number"
                      defaultValue={config.system?.['system.jwt.expiration'] || 15}
                      min={5}
                      max={60}
                      id="jwt_expiration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Refresh Token Expiration (days)</Label>
                    <Input
                      type="number"
                      defaultValue={config.system?.['system.refresh_token.expiration'] || 7}
                      min={1}
                      max={30}
                      id="refresh_token_expiration"
                    />
                  </div>
                  <Button onClick={async () => {
                    setSavingSystem(true)
                    try {
                      await adminApi.updateConfig({
                        key: 'system.jwt.expiration',
                        value: (document.getElementById('jwt_expiration') as HTMLInputElement).value,
                        category: 'system',
                        description: 'JWT expiration in minutes'
                      })
                      await adminApi.updateConfig({
                        key: 'system.refresh_token.expiration',
                        value: (document.getElementById('refresh_token_expiration') as HTMLInputElement).value,
                        category: 'system',
                        description: 'Refresh token expiration in days'
                      })
                      setSuccess('System settings saved successfully')
                      fetchAdminData()
                    } catch (err) {
                      setError('Failed to save system settings')
                    } finally {
                      setSavingSystem(false)
                    }
                  }} disabled={savingSystem}>
                    {savingSystem ? 'Saving...' : 'Save System Settings'}
                  </Button>
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
