import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// 페이지 컴포넌트 import
import AdminLoginPage from './pages/AdminPage/AdminLoginPage';
import AdminDashboard from './pages/AdminPage/AdminDashboard';
import TeacherLoginPage from './pages/TeacherPage/TeacherLoginPage';
import ClassPreparation from './pages/TeacherPage/ClassPreparation';
import ActiveClass from './pages/ClassPage/ActiveClass';
import FeedPage from './pages/FeedPage/FeedPage';
import WidgetPage from './pages/FeedPage/WidgetPage';
import RankingPage from './pages/RankingPage/RankingPage';

// 권한 체크 래퍼 컴포넌트
const ProtectedRoute = ({ children, role }) => {
  // 여기서 로그인 상태와 권한 확인
  const isAuthenticated = localStorage.getItem(role === 'admin' ? 'adminAuth' : 'teacherAuth');
  
  if (!isAuthenticated) {
    // 로그인되지 않은 경우 해당 로그인 페이지로 리디렉션
    return <Navigate to={role === 'admin' ? '/admin/login' : '/teacher/login'} replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 관리자 영역 */}
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* 선생님 영역 */}
          <Route path="/teacher/login" element={<TeacherLoginPage />} />
          <Route path="/teacher/prepare" element={
            <ProtectedRoute role="teacher">
              <ClassPreparation />
            </ProtectedRoute>
          } />
          <Route path="/teacher/class/:sessionId" element={
            <ProtectedRoute role="teacher">
              <ActiveClass />
            </ProtectedRoute>
          } />

          {/* 뷰어 영역 (인증 필요 없음) */}
          <Route path="/feed/:urlIdentifier" element={<FeedPage />} />
          <Route path="/widget/:urlIdentifier" element={<WidgetPage />} />
          <Route path="/rankings" element={<RankingPage />} />

          {/* 기본 경로 리디렉션 */}
          <Route path="/" element={<Navigate to="/teacher/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
