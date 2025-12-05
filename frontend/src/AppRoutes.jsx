import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import DashboardLayout from './components/layout/DashboardLayout';
import TenantDashboard from './pages/tenant/TenantDashboard';
import LandlordDashboard from './pages/landlord/LandlordDashboard';
import UploadRoomPage from './pages/landlord/UploadRoomPage';
import MessagePage from './pages/shared/MessagesPage';
import AccountPage from './pages/shared/AccountPage';
import RoomDetailPage from './pages/shared/RoomDetailPage';
import FindRoomsPage from './pages/shared/FindRoomsPage'; // ✅ NOW SHARED
import MatchPage from './pages/tenant/MatchPage';
import FindRoommatesPage from './pages/tenant/FindRoommatesPage';
import BookmarksPage from './pages/tenant/BookmarksPage';
import MyRoomsPage from './pages/landlord/MyRoomsPage';
import { MessageProvider } from './contexts/MessageContext'; // ✅ Import

function AppRoutes() {
  return (
    <MessageProvider>
    <Routes>
      {/* Auth routes - NO LAYOUT */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      
      {/* Dashboard routes - WITH LAYOUT */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        {/* Default redirect to tenant dashboard */}
        <Route index element={<Navigate to="/dashboard/tenant" replace />} />
        
        {/* ===== TENANT ROUTES ===== */}
        <Route path="tenant" element={<TenantDashboard />} />
        <Route path="tenant/find-rooms" element={<FindRoomsPage />} /> {/* ✅ SHARED */}
        <Route path="tenant/find-roommates" element={<FindRoommatesPage />} />
        <Route path="tenant/bookmarks" element={<BookmarksPage />} />
        <Route path="tenant/match" element={<MatchPage />} />
        <Route path="tenant/room/:roomId" element={<RoomDetailPage />} />
        <Route path="tenant/account" element={<AccountPage />} />
        
        {/* ===== LANDLORD ROUTES ===== */}
        <Route path="landlord" element={<LandlordDashboard />} />
        <Route path="landlord/upload-room" element={<UploadRoomPage />} />
        <Route path="landlord/my-rooms" element={<MyRoomsPage />} />
        <Route path="landlord/browse-rooms" element={<FindRoomsPage />} /> {/* ✅ SHARED */}
        <Route path="landlord/room/:roomId" element={<RoomDetailPage />} />
        <Route path="landlord/edit-room/:roomId" element={<UploadRoomPage />} />
        <Route path="landlord/account" element={<AccountPage />} />
        
        {/* ===== SHARED ROUTES ===== */}
        <Route path="messages" element={<MessagePage />} />
      </Route>
      
      {/* ===== STANDALONE ROUTES (outside dashboard layout) ===== */}
      <Route path="/rooms/:roomId" element={<RoomDetailPage />} />
      <Route path="/landlord/:landlordId" element={<LandlordDashboard />} />
      
      {/* Default & catch-all routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </MessageProvider>
  );
}

export default AppRoutes;