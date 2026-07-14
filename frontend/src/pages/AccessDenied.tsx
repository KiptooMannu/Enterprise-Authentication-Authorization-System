import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { ShieldAlert, ArrowLeft, Home, LogOut } from 'lucide-react'

const AccessDenied: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md mx-4 border-2 border-destructive/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-destructive">Access Denied</CardTitle>
            <CardDescription className="mt-2">
              You don't have permission to access this resource
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Current User:</strong> {user?.username || 'Not logged in'}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Current Role:</strong> {user?.role || 'None'}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Required Role:</strong> Administrator or higher
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>This page requires elevated permissions. If you believe this is an error, please contact your system administrator.</p>
          </div>

          <div className="space-y-2 pt-4">
            <Button onClick={handleBackToDashboard} className="w-full" variant="default">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex gap-2">
              <Button onClick={() => navigate(-1)} variant="outline" className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={handleLogout} variant="outline" className="flex-1">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Need help? <Link to="/login" className="text-primary hover:underline">Contact Support</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AccessDenied
