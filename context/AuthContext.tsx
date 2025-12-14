import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
    id: string;
    email: string;
    role: 'ADMIN' | 'USER';
};

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (user: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/auth/me');
            const data = await res.json();
            if (data.authenticated && data.user) {
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            await fetch('http://localhost:3000/api/auth/logout', { method: 'POST' });
            setUser(null);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            loading,
            login,
            logout,
            checkAuth
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
