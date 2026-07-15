import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  AlertTriangle, Shield, Activity, Globe, Lock, Eye, EyeOff, 
  TrendingUp, CheckCircle2, XCircle, Clock, MapPin, User, 
  RefreshCw, Filter, Download, AlertCircle
} from 'lucide-react'

interface ThreatEvent {
  id: string
  type: 'failed_login' | 'suspicious_location' | 'rapid_attempts' | 'blocked_ip' | 'account_lockout'
  severity: 'low' | 'medium' | 'high' | 'critical'
  user: string
  ip: string
  location: string
  timestamp: string
  description: string
  status: 'active' | 'resolved' | 'investigating'
}

const ThreatDetectionDashboard: React.FC = () => {
  const [threats, setThreats] = useState<ThreatEvent[]>([
    {
      id: '1',
      type: 'suspicious_location',
      severity: 'high',
      user: 'john_doe',
      ip: '192.168.1.100',
      location: 'Moscow, Russia',
      timestamp: '5 minutes ago',
      description: 'Login from unusual geographic location',
      status: 'investigating'
    },
    {
      id: '2',
      type: 'rapid_attempts',
      severity: 'critical',
      user: 'unknown',
      ip: '10.0.0.50',
      location: 'Unknown',
      timestamp: '2 minutes ago',
      description: '20 failed login attempts in 1 minute',
      status: 'active'
    },
    {
      id: '3',
      type: 'blocked_ip',
      severity: 'medium',
      user: 'unknown',
      ip: '172.16.0.25',
      location: 'Beijing, China',
      timestamp: '15 minutes ago',
      description: 'IP address blocked due to suspicious activity',
      status: 'resolved'
    },
    {
      id: '4',
      type: 'account_lockout',
      severity: 'high',
      user: 'jane_smith',
      ip: '192.168.1.200',
      location: 'London, UK',
      timestamp: '1 hour ago',
      description: 'Account locked after 5 failed attempts',
      status: 'investigating'
    },
    {
      id: '5',
      type: 'failed_login',
      severity: 'low',
      user: 'bob_wilson',
      ip: '192.168.1.150',
      location: 'New York, USA',
      timestamp: '2 hours ago',
      description: 'Single failed login attempt',
      status: 'resolved'
    }
  ])

  const [showResolved, setShowResolved] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const severityColors = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const typeIcons = {
    failed_login: <Lock className="h-4 w-4" />,
    suspicious_location: <MapPin className="h-4 w-4" />,
    rapid_attempts: <Activity className="h-4 w-4" />,
    blocked_ip: <Shield className="h-4 w-4" />,
    account_lockout: <AlertTriangle className="h-4 w-4" />
  }

  const activeThreats = threats.filter(t => t.status !== 'resolved')
  const criticalThreats = threats.filter(t => t.severity === 'critical' && t.status !== 'resolved')

  const handleResolve = (id: string) => {
    setThreats(threats.map(t => 
      t.id === id ? { ...t, status: 'resolved' as const } : t
    ))
  }

  const handleInvestigate = (id: string) => {
    setThreats(threats.map(t => 
      t.id === id ? { ...t, status: 'investigating' as const } : t
    ))
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeThreats.length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalThreats.length}</div>
            <p className="text-xs text-muted-foreground">Immediate action needed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">12</div>
            <p className="text-xs text-muted-foreground">Threats neutralized</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">92%</div>
            <p className="text-xs text-muted-foreground">System health</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalThreats.length > 0 && (
        <Card className="border-2 border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Critical Alerts
            </CardTitle>
            <CardDescription>Immediate action required</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalThreats.map(threat => (
              <div key={threat.id} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{threat.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {threat.user} • {threat.ip} • {threat.location}
                  </p>
                </div>
                <Button size="sm" variant="destructive">
                  Investigate
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Threat List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Threat Events
              </CardTitle>
              <CardDescription>Real-time security monitoring</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowResolved(!showResolved)}>
                {showResolved ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showResolved ? 'Hide' : 'Show'} Resolved
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto-Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {threats
              .filter(t => showResolved || t.status !== 'resolved')
              .map(threat => (
                <div key={threat.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${severityColors[threat.severity]}`}>
                        {typeIcons[threat.type]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{threat.description}</h3>
                          <Badge className={severityColors[threat.severity]} variant="outline">
                            {threat.severity.toUpperCase()}
                          </Badge>
                          <Badge variant={threat.status === 'resolved' ? 'default' : 'secondary'}>
                            {threat.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{threat.user}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            <span>{threat.ip}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{threat.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{threat.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {threat.status !== 'resolved' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleInvestigate(threat.id)}
                        >
                          Investigate
                        </Button>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleResolve(threat.id)}
                        >
                          Resolve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Security Recommendations
          </CardTitle>
          <CardDescription>AI-powered security insights</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Enable MFA for all admin accounts</p>
              <p className="text-xs text-muted-foreground">3 admin accounts without MFA enabled</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Review failed login patterns</p>
              <p className="text-xs text-muted-foreground">Unusual activity detected from IP range 192.168.1.0/24</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Password policy compliance at 95%</p>
              <p className="text-xs text-muted-foreground">12 users need password update</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ThreatDetectionDashboard
