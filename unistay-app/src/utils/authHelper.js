import { getItem, deleteItem } from './storage';
import { API_URL } from '../constants/api';

/**
 * Checks for a valid token in storage and fetches the user profile if valid.
 * @returns {Promise<{user: object, token: string} | null>}
 */
export const checkAutoLogin = async () => {
    try {
        const token = await getItem('userToken');
        if (!token) return null;

        const response = await fetch(`${API_URL}/api/users/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // Token might be invalid or expired
            await logout();
            return null;
        }

        const data = await response.json();
        if (data.success && data.user) {
            return { user: data.user, token };
        }
        
        return null;
    } catch (error) {
        console.error("Auto-login error:", error);
        return null;
    }
};

/**
 * Logs the user out by clearing storage items.
 */
export const logout = async () => {
    try {
        await deleteItem('userToken');
        await deleteItem('userRole');
    } catch (error) {
        console.error("Logout error:", error);
    }
};
