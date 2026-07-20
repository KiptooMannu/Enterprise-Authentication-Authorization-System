import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { LogOut, User, Shield, Clock, Globe, Key, FileText, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react'
import { sessionApi, oauthApi, authApi } from '../services/api'
import { getApiErrorMessage } from '../lib/errors'
import config from '../config/env'


interface Session {
  id: number
  token: string
  ipAddress: string
  userAgent: string
  createdAt: string
  expiryDate: string
}

interface AuditLog {
  id: number
  action: string
  timestamp: string
  ipAddress: string
  details: string
}

const Dashboard: React.FC = () => {
  const { user, logout, logoutAll } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [oauthStatus, setOauthStatus] = useState<{ google: boolean; github: boolean }>({ google: false, github: false })
  
  // Modals state
  const [activeModal, setActiveModal] = useState<'password' | 'history' | 'oauth' | null>(null)
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    try {
      const sessRes = await sessionApi.getActiveSessions()
      setSessions(sessRes.data)
      
      const oauthRes = await oauthApi.getLinkedAccounts()
      setOauthStatus(oauthRes.data)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleLogout = () => {
    logout()
  }

  const handleLogoutAll = async () => {
    try {
      setLoading(true)
      await logoutAll()
    } catch (err) {
      console.error('Logout all failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeSession = async (token: string) => {
    setError('')
    try {
      await sessionApi.revokeSession(token)
      setSessions((prev) => prev.filter((s) => s.token !== token))
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Failed to revoke session.'))
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await authApi.changePassword(currentPassword, newPassword)
      setSuccess('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Failed to change password.'))
    } finally {
      setLoading(false)
    }
  }

  const handleFetchHistory = async () => {
    setError('')
    setLoading(true)
    try {
      const logsRes = await authApi.getMyAuditLogs()
      setLogs(logsRes.data)
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Failed to load login history.'))
    } finally {
      setLoading(false)
    }
  }

  const handleUnlinkOAuth = async (provider: string) => {
    setError('')
    setSuccess('')
    try {
      await oauthApi.unlinkAccount(provider)
      setSuccess(`Successfully unlinked your ${provider} account.`)
      fetchData()
    } catch (err: any) {
      setError(getApiErrorMessage(err, `Failed to unlink ${provider} account.`))
    }
  }

  const openModal = (type: 'password' | 'history' | 'oauth') => {
    setError('')
    setSuccess('')
    setActiveModal(type)
    if (type === 'history') {
      handleFetchHistory()
    }
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">AuthCore</span>
            </div>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Button asChild variant="default" size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  <Link to="/admin">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Link>
                </Button>
              )}
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span>{user?.username}</span>
                <span className="text-muted-foreground">({user?.role})</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back, {user?.username}!</p>
        </div>

        {/* Security Alert Banner */}
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile
              </CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Username:</span>
                <p className="font-medium">{user?.username}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Email:</span>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Role:</span>
                <p className="font-medium">{user?.role}</p>
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Account Age
              </CardTitle>
              <CardDescription>When you joined</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Active Sessions
              </CardTitle>
              <CardDescription>Device and location tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-36 overflow-y-auto space-y-2">
                {sessions.map((sess) => (
                  <div key={sess.id} className="flex justify-between items-center text-xs border-b pb-1">
                    <div>
                      <span className="font-medium block">{sess.ipAddress}</span>
                      <span className="text-muted-foreground block truncate max-w-[150px]" title={sess.userAgent}>
                        {sess.userAgent}
                      </span>
                    </div>
                    {sess.token === localStorage.getItem('refreshToken') ? (
                      <span className="text-green-500 font-medium">Current</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSession(sess.token)}
                        className="text-destructive text-[10px] h-6 px-2 hover:bg-destructive/10"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full text-xs" onClick={handleLogoutAll} disabled={loading}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout All Other Devices
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common account management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <Button variant="outline" onClick={() => openModal('password')} className="flex items-center justify-start gap-2">
                <Key className="h-4 w-4 text-primary" />
                Change Password
              </Button>
              <Button variant="outline" onClick={() => openModal('history')} className="flex items-center justify-start gap-2">
                <FileText className="h-4 w-4 text-primary" />
                View Login History
              </Button>
              <Button variant="outline" onClick={() => openModal('oauth')} className="flex items-center justify-start gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Manage OAuth Accounts
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* --- MODALS --- */}
      
      {/* Change Password Modal */}
      {activeModal === 'password' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your login password</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveModal(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 p-3 text-sm text-green-700 bg-green-50 rounded-md dark:bg-green-950/20 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{success}</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Login History Modal */}
      {activeModal === 'history' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Login History</CardTitle>
                <CardDescription>Audit logs of your recent activities</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveModal(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="max-h-[350px] overflow-y-auto space-y-3">
              {loading ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">No logs found.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="text-xs border-b pb-2 flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{log.action}</p>
                      <p className="text-muted-foreground">{log.details}</p>
                    </div>
                    <div className="text-right text-muted-foreground/80">
                      <p>{new Date(log.timestamp).toLocaleString()}</p>
                      <p className="text-[10px]">IP: {log.ipAddress}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manage OAuth Accounts Modal */}
      {activeModal === 'oauth' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manage OAuth Connections</CardTitle>
                <CardDescription>Link or unlink third-party accounts</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveModal(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 p-3 text-sm text-green-700 bg-green-50 rounded-md dark:bg-green-950/20 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{success}</span>
                </div>
              )}

              <div className="space-y-3">
                {/* Google Connection */}
                <div className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <span className="font-semibold block">Google</span>
                    <span className="text-xs text-muted-foreground">
                      {oauthStatus.google ? 'Linked' : 'Not linked'}
                    </span>
                  </div>
                  {oauthStatus.google ? (
                    <Button variant="destructive" size="sm" onClick={() => handleUnlinkOAuth('google')}>
                      Unlink
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => window.location.href = `${config.oauthBaseUrl}/oauth2/authorization/google`}>
                      Link
                    </Button>
                  )}
                </div>

                {/* GitHub Connection */}
                <div className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <span className="font-semibold block">GitHub</span>
                    <span className="text-xs text-muted-foreground">
                      {oauthStatus.github ? 'Linked' : 'Not linked'}
                    </span>
                  </div>
                  {oauthStatus.github ? (
                    <Button variant="destructive" size="sm" onClick={() => handleUnlinkOAuth('github')}>
                      Unlink
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => window.location.href = `${config.oauthBaseUrl}/oauth2/authorization/github`}>
                      Link
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Dashboard
