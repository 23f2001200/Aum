
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RecordPage from './pages/Record';
import VideoPlayer from './pages/VideoPlayer';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="record" element={<RecordPage />} />
          <Route path="video/:id" element={<VideoPlayer />} />
        </Route>
        {/* Custom shareable video pages - /aum/:slug */}
        <Route path="/aum/:id" element={<VideoPlayer />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
