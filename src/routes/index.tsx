import { useEffect } from 'react';
import { Button } from '@/components/atoms/button';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import SettingsPage from '@/pages/settings';
import IndicesPage from '@/pages/indices';
import ServicesPage from '@/pages/services';
import DocumentDetail from '@/pages/documents/detail';
import DocumentsPage from '@/pages/documents';
import HomePage from '@/pages/home';
import ChatPage from '@/pages/chat';
import LoginPage from '@/pages/login';
import RootLayout from '@/components/templates/root-layout';
import AuthLayout from '@/components/templates/auth-layout';
import { useAuth } from '@/providers/auth-provider';
import { useProjectStore } from '@/stores/use-project-store';
import ProjectSettingsPage from '@/pages/projects/settings';
import CreateProjectPage from '@/pages/projects/create';

const RequireAuth = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const { hasLoaded, isLoading, error, loadProjects } = useProjectStore();

    useEffect(() => {
        if (isAuthenticated) void loadProjects();
    }, [isAuthenticated, loadProjects]);

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location.pathname + location.search + location.hash }} replace />;
    }

    if (!hasLoaded) {
        return <AuthLayout>
            {error && !isLoading
                ? <div className="space-y-4"><p role="alert">{error}</p><Button onClick={() => void loadProjects()}>다시 시도</Button></div>
                : <p role="status">프로젝트 목록을 불러오고 있습니다…</p>}
        </AuthLayout>;
    }

    return <Outlet />;
};

const RequireProject = () => {
    const hasProjects = useProjectStore((state) => state.projects.length > 0);
    return hasProjects
        ? <RootLayout><Outlet /></RootLayout>
        : <Navigate to="/projects/new" replace />;
};

const LoginRoute = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const from: unknown = location.state?.from;
    const destination = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !/^\/login(?:[/?#]|$)/.test(from)
        ? from
        : '/home';

    return isAuthenticated
        ? <Navigate to={destination} replace />
        : <AuthLayout><LoginPage /></AuthLayout>;
};

export const AppRoutes = () => {
    const { isLoading } = useAuth();

    if (isLoading) {
        return <AuthLayout><p role="status" className="text-sm text-muted-foreground">로그인 정보를 확인하고 있습니다…</p></AuthLayout>;
    }

    return (
        <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route element={<RequireAuth />}>
                <Route path="/projects/new" element={<AuthLayout><CreateProjectPage /></AuthLayout>} />
                <Route element={<RequireProject />}>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home/*" element={<HomePage />} />
            <Route path="/service/*" element={<ServicesPage />} />
            <Route path="/index/*" element={<IndicesPage />} />
            <Route path="/documents/:documentId" element={<DocumentDetail />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/projects/settings" element={<ProjectSettingsPage />} />
            <Route path="/setting" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
                </Route>
            </Route>
        </Routes>
    )
}
