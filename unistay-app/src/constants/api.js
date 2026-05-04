import { Platform } from 'react-native';

/**
 * Backend API configuration
 * Variables are pulled from the .env file in the root directory.
 * Note: EXPO_PUBLIC_ prefix is required for Expo to expose variables.
 */
const getBaseUrl = () => {
    // Check if production mode is enabled in .env
    const isProduction = process.env.EXPO_PUBLIC_IS_PRODUCTION === 'true';

    if (isProduction) {
        return process.env.EXPO_PUBLIC_API_URL_PROD;
    }

    // Local development fallback logic
    if (Platform.OS === 'web') {
        return process.env.EXPO_PUBLIC_API_URL_LOCAL_WEB || 'http://localhost:3000';
    }

    // Mobile local IP fallback
    return process.env.EXPO_PUBLIC_API_URL_LOCAL_MOBILE || 'http://localhost:3000';
};

export const API_URL = getBaseUrl();
export const PAYMENTS_URL = `${API_URL}/api/payments`;
export const PAYMENT_TYPES_URL = `${API_URL}/api/payment-types`;
