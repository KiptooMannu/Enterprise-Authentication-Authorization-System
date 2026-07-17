import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

// Mock data - in production, this would come from the API
const loginTrendsData = [
  { name: 'Mon', successful: 120, failed: 5, total: 125 },
  { name: 'Tue', successful: 145, failed: 8, total: 153 },
  { name: 'Wed', successful: 132, failed: 3, total: 135 },
  { name: 'Thu', successful: 168, failed: 12, total: 180 },
  { name: 'Fri', successful: 189, failed: 7, total: 196 },
  { name: 'Sat', successful: 98, failed: 4, total: 102 },
  { name: 'Sun', successful: 85, failed: 2, total: 87 },
]

const userGrowthData = [
  { month: 'Jan', users: 450, newUsers: 45 },
  { month: 'Feb', users: 520, newUsers: 70 },
  { month: 'Mar', users: 610, newUsers: 90 },
  { month: 'Apr', users: 780, newUsers: 170 },
  { month: 'May', users: 920, newUsers: 140 },
  { month: 'Jun', users: 1150, newUsers: 230 },
]

const securityIncidentsData = [
  { name: 'Failed Logins', value: 45 },
  { name: 'Suspicious Activity', value: 12 },
  { name: 'Blocked IPs', value: 28 },
  { name: 'Account Lockouts', value: 8 },
  { name: 'Token Revocations', value: 15 },
]

const sessionActivityData = [
  { time: '00:00', active: 45 },
  { time: '04:00', active: 32 },
  { time: '08:00', active: 89 },
  { time: '12:00', active: 156 },
  { time: '16:00', active: 198 },
  { time: '20:00', active: 142 },
  { time: '24:00', active: 78 },
]

const roleDistributionData = [
  { name: 'User', value: 850 },
  { name: 'Moderator', value: 120 },
  { name: 'Manager', value: 45 },
  { name: 'Admin', value: 25 },
  { name: 'Super Admin', value: 5 },
]

const geographicData = [
  { country: 'United States', users: 450, percentage: 39 },
  { country: 'United Kingdom', users: 180, percentage: 16 },
  { country: 'Germany', users: 120, percentage: 10 },
  { country: 'Canada', users: 95, percentage: 8 },
  { country: 'Australia', users: 80, percentage: 7 },
  { country: 'France', users: 70, percentage: 6 },
  { country: 'Others', users: 200, percentage: 14 },
]

export const LoginTrendsChart: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Login Trends (Last 7 Days)</CardTitle>
      <CardDescription>Successful vs failed login attempts</CardDescription>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={loginTrendsData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="successful" stackId="1" stroke="#00C49F" fill="#00C49F" fillOpacity={0.6} name="Successful" />
          <Area type="monotone" dataKey="failed" stackId="1" stroke="#FF8042" fill="#FF8042" fillOpacity={0.6} name="Failed" />
        </AreaChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
)

export const UserGrowthChart: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>User Growth (Last 6 Months)</CardTitle>
      <CardDescription>Total users and new registrations</CardDescription>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={userGrowthData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="users" stroke="#8884D8" strokeWidth={2} name="Total Users" />
          <Line type="monotone" dataKey="newUsers" stroke="#82CA9D" strokeWidth={2} name="New Users" />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
)

export const SecurityIncidentsChart: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Security Incidents</CardTitle>
      <CardDescription>Breakdown of security events</CardDescription>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={securityIncidentsData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {securityIncidentsData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
)

export const SessionActivityChart: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Session Activity (24 Hours)</CardTitle>
      <CardDescription>Active sessions throughout the day</CardDescription>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sessionActivityData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="active" fill="#0088FE" name="Active Sessions" />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
)

export const RoleDistributionChart: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Role Distribution)</CardTitle>
      <CardDescription>User distribution by role</CardDescription>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={roleDistributionData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {roleDistributionData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
)

export const GeographicDistributionChart: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Geographic Distribution</CardTitle>
      <CardDescription>Users by country</CardDescription>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={geographicData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="country" type="category" width={100} />
          <Tooltip />
          <Legend />
          <Bar dataKey="users" fill="#00C49F" name="Users" />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
)

export const AnalyticsDashboard: React.FC = () => (
  <div className="space-y-6">
    <div className="grid gap-6 md:grid-cols-2">
      <LoginTrendsChart />
      <UserGrowthChart />
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      <SecurityIncidentsChart />
      <SessionActivityChart />
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      <RoleDistributionChart />
      <GeographicDistributionChart />
    </div>
  </div>
)

export default AnalyticsDashboard
