import React, { createContext, useState, useEffect } from 'react';
import { checkAutoLogin, logout as performLogout } from '../utils/authHelper';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const result = await checkAutoLogin();
            if (result) {
                setUser(result.user);
                setToken(result.token);
            }
            setIsLoading(false);
        };
        initializeAuth();
    }, []);

    const login = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
    };

    const logout = async () => {
        await performLogout();
        setUser(null);
        setToken(null);
        // Navigation after logout is handled by the calling component
    };

    const updateAuthUser = (updatedUserData) => {
        setUser(updatedUserData);
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateAuthUser }}>
            {children}
        </AuthContext.Provider>
    );
};
