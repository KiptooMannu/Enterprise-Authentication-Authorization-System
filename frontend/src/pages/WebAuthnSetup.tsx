import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { 
  Fingerprint, Shield, CheckCircle2, AlertCircle, ArrowLeft, Plus, Trash2, 
  Smartphone, Key, Clock, Globe, RefreshCw, Zap
} from 'lucide-react'

interface Passkey {
  id: string
  name: string
  type: 'platform' | 'cross-platform'
  createdAt: string
  lastUsed: string
  device: string
}

const WebAuthnSetup: React.FC = () => {
  const navigate = useNavigate()
  const [passkeys, setPasskeys] = useState<Passkey[]>([
    {
      id: '1',
      name: "John's MacBook Pro",
      type: 'platform',
      createdAt: '2024-01-15',
      lastUsed: '2 hours ago',
      device: 'MacBook Pro, macOS 14.0'
    },
    {
      id: '2',
      name: "John's iPhone 15",
      type: 'cross-platform',
      createdAt: '2024-01-20',
      lastUsed: '1 day ago',
      device: 'iPhone 15, iOS 17.0'
    }
  ])
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAddPasskey = async () => {
    setIsAdding(true)
    setError('')
    setSuccess('')

    // Simulate WebAuthn registration
    setTimeout(() => {
      const newPasskey: Passkey = {
        id: Date.now().toString(),
        name: `New Security Key ${passkeys.length + 1}`,
        type: 'platform',
        createdAt: new Date().toISOString().split('T')[0],
        lastUsed: 'Just now',
        device: 'New Device'
      }
      setPasskeys([...passkeys, newPasskey])
      setSuccess('Security key added successfully!')
      setIsAdding(false)
    }, 2000)
  }

  const handleRemovePasskey = (id: string) => {
    setPasskeys(passkeys.filter(pk => pk.id !== id))
    setSuccess('Security key removed successfully!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Fingerprint className="h-8 w-8 text-emerald-600" />
            <div>
              <h1 className="text-2xl font-bold">Passkeys & Security Keys</h1>
              <p className="text-muted-foreground">Manage your WebAuthn credentials</p>
            </div>
          </div>
        </div>

        {success && (
          <div className="flex items-center gap-2 p-3 mb-4 text-sm text-green-700 bg-green-50 rounded-md dark:bg-green-950/20 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 text-sm text-destructive bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* What are Passkeys */}
        <Card className="mb-6 border-2 border-emerald-200 dark:border-emerald-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              What are Passkeys?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Passkeys are a more secure and convenient alternative to passwords. They use biometrics 
              (fingerprint, face recognition) or device PINs to authenticate you.
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-emerald-600" />
                <span>Faster login</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span>More secure</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Key className="h-4 w-4 text-emerald-600" />
                <span>No passwords</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Passkey */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Passkey</CardTitle>
            <CardDescription>Register a new security key for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleAddPasskey} 
              disabled={isAdding}
              className="w-full"
            >
              {isAdding ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Passkey
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Registered Passkeys */}
        <Card>
          <CardHeader>
            <CardTitle>Your Passkeys</CardTitle>
            <CardDescription>Manage your registered security keys</CardDescription>
          </CardHeader>
          <CardContent>
            {passkeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No passkeys registered yet</p>
                <p className="text-sm">Add your first passkey to enable passwordless login</p>
              </div>
            ) : (
              <div className="space-y-3">
                {passkeys.map((passkey) => (
                  <div key={passkey.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                          {passkey.type === 'platform' ? (
                            <Smartphone className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <Key className="h-5 w-5 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{passkey.name}</h3>
                          <p className="text-sm text-muted-foreground">{passkey.device}</p>
                        </div>
                      </div>
                      <Badge variant={passkey.type === 'platform' ? 'default' : 'secondary'}>
                        {passkey.type === 'platform' ? 'Device' : 'Cross-Platform'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Last used: {passkey.lastUsed}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        <span>Added: {passkey.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleRemovePasskey(passkey.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Register multiple passkeys</p>
                <p className="text-xs text-muted-foreground">Add passkeys on multiple devices for backup access</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Keep your device secure</p>
                <p className="text-xs text-muted-foreground">Use device PIN, fingerprint, or face recognition</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Remove unused passkeys</p>
                <p className="text-xs text-muted-foreground">Regularly clean up old or lost devices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default WebAuthnSetup
