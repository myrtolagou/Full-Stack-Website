import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

import LoginPage      from './pages/Login/LoginPage';
import HomePage       from './pages/Home/HomePage';
import BlogPage       from './pages/Workflows/BlogPage';
import NewsPage       from './pages/Workflows/NewsPage';
import CompetitorPage from './pages/Workflows/CompetitorPage';
import InboxPage      from './pages/Inbox/InboxPage';
import CarouselsPage  from './pages/Carousels/CarouselsPage';
import UsersPage      from './pages/Users/UsersPage';
import SettingsPage   from './pages/Settings/SettingsPage';
import SchedulerPage  from './pages/Scheduler/SchedulerPage';
import AnalyticsPage  from './pages/Analytics/AnalyticsPage';
import CalendarPage   from './pages/Calendar/CalendarPage';
import InstagramPage  from './pages/Instagram/InstagramPage';
import LinkedInPage   from './pages/LinkedIn/LinkedInPage';
import BlogDraftsPage from './pages/BlogDrafts/BlogDraftsPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — all pages share the Sidebar + Topbar layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/"                     element={<HomePage />} />
            <Route path="/workflows/blog"       element={<BlogPage />} />
            <Route path="/workflows/news"       element={<NewsPage />} />
            <Route path="/workflows/competitor" element={<CompetitorPage />} />
            <Route path="/inbox"                element={<InboxPage />} />
            <Route path="/carousels"            element={<CarouselsPage />} />
            <Route path="/blog-drafts"          element={<BlogDraftsPage />} />
            <Route path="/analytics"            element={<AnalyticsPage />} />
            <Route path="/calendar"             element={<CalendarPage />} />
            <Route path="/instagram"            element={<InstagramPage />} />
            <Route path="/linkedin"             element={<LinkedInPage />} />
            <Route path="/scheduler"            element={<SchedulerPage />} />
            <Route path="/users"                element={<UsersPage />} />
            <Route path="/settings"             element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}