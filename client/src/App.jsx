import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import { Toaster } from 'react-hot-toast';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Policies from './pages/Policies';
import Premiums from './pages/Premiums';
import Claims from './pages/Claims';
import Documents from './pages/Documents';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes Wrapper */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/policies" element={<Policies />} />
                <Route path="/premiums" element={<Premiums />} />
                <Route path="/claims" element={<Claims />} />
                <Route path="/documents" element={<Documents />} />

                {/* Staff Only Routes */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'AGENT']} />}>
                  <Route path="/customers" element={<Customers />} />
                </Route>
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
