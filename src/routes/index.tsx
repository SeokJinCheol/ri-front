import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import DocumentsPage from '@/pages/documents';
import HomePage from '@/pages/home';
import WorkspacePage from '@/pages/workspace';
import LoginPage from '@/pages/login';
import RootLayout from '@/components/templates/root-layout';
import AuthLayout from '@/components/templates/auth-layout';
import { useAuth } from '@/providers/auth-provider';
import { useProjectStore } from '@/stores/use-project-store';
import CreateProjectPage from '@/pages/projects/create';

const RequireAuth = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location.pathname + location.search + location.hash }} replace />;
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
            <Route path="/service" element={<WorkspacePage title="Service" description="서비스별 인덱스 모음을 관리합니다." />} />
            <Route path="/index" element={<WorkspacePage title="Index" description="인덱스별 Document 모음을 관리합니다." />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/chat" element={<WorkspacePage title="Chat" description="프로젝트 문서를 바탕으로 대화합니다." />} />
            <Route path="/setting" element={<WorkspacePage title="Setting" description="프로젝트 설정을 관리합니다." />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
                </Route>
            </Route>
        </Routes>
    )
}
