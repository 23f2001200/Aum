
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RecordPage from './pages/Record';
import VideoPlayer from './pages/VideoPlayer';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            {/* Protected routes - require authentication */}
            <Route path="record" element={
              <ProtectedRoute>
                <RecordPage />
              </ProtectedRoute>
            } />
            <Route path="video/:id" element={<VideoPlayer />} />
          </Route>
          {/* Custom shareable video pages - /aum/:slug (public) */}
          <Route path="/aum/:id" element={<VideoPlayer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
