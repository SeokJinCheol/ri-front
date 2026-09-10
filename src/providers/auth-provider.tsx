import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, userData: User) => void;
    loginTemporary: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "access_token";
const TEMPORARY_TOKEN = "real-iron-local-demo";
const TEMPORARY_USER: User = { id: "demo-user", name: "체험 사용자", email: "demo@realiron.local" };

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem(TOKEN_KEY);
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                // 실제 프로젝트 연동 시: const res = await fetchUserInfo(token);
                // 임시 복원 더미 데이터
                setUser(token === TEMPORARY_TOKEN ? TEMPORARY_USER : { id: "user-1", name: "관리자", email: "admin@example.com" });
            } catch (error) {
                console.error("세션 복구 실패:", error);
                localStorage.removeItem(TOKEN_KEY);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem(TOKEN_KEY, token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                loginTemporary: () => login(TEMPORARY_TOKEN, TEMPORARY_USER),
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
