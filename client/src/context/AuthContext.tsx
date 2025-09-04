import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    token: string | null;
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (token) {
            try {
                const decodedToken: { id: string, name: string, email: string } = jwtDecode(token);
                // You might want to check token expiration here
                setUser({ id: decodedToken.id, name: decodedToken.name, email: decodedToken.email });
                localStorage.setItem('token', token);
            } catch (error) {
                console.error("Invalid token:", error);
                logout();
            }
        } else {
            localStorage.removeItem('token');
            setUser(null);
        }
    }, [token]);

    const login = (newToken: string) => {
        setToken(newToken);
    };

    const logout = () => {
        setToken(null);
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};