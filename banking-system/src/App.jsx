import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './layouts/admin/AdminLayout.jsx'
import UserLayout from './layouts/user/UserLayout.jsx'
import { AdminDashboard, AdminCustomers, AdminAccounts, AdminTransactions, AdminSettings, AdminLogin, AdminSignup, AdminUsersRoles, AdminApprovals, AdminReports, AdminAuditLogs, AdminIntegrations, AdminProfile } from './pages/admin'
import { UserDashboard, UserAccounts, UserTransfers, UserCards, UserLogin, UserProfile, UserLoans, UserLoansApply } from './pages/user'
import UserSignup from './pages/user/Signup.jsx'
import NotFound from './pages/common/NotFound.jsx'
import Unauthorized from './pages/common/Unauthorized.jsx'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/user/login" replace />} />

        {/* Admin auth */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignup />} />

        {/* Admin area */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="users-roles" element={<AdminUsersRoles />} />
          <Route path="approvals" element={<AdminApprovals />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="integrations" element={<AdminIntegrations />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        {/* User auth */}
        <Route path="/user/login" element={<UserLogin />} />
        <Route path="/user/signup" element={<UserSignup />} />

        {/* User area */}
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="accounts" element={<UserAccounts />} />
          <Route path="transfers" element={<UserTransfers />} />
          <Route path="cards" element={<UserCards />} />
          <Route path="loans" element={<UserLoans />} />
          <Route path="loans/apply" element={<UserLoansApply />} />
          <Route path="profile" element={<UserProfile />} />
        </Route>

        {/* Utility */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
