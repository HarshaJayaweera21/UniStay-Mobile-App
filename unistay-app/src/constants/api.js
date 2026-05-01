import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Dynamically determines the backend base URL.
 * In development (Expo Go), it uses the host IP of the Metro server.
 * This allows the app to work on both emulators and physical devices seamlessly.
 */
const getBaseUrl = () => {
    // Check if we have a debugger host (e.g., '192.168.8.101:8081')
    const debuggerHost = Constants.expoConfig?.hostUri;
    
    if (debuggerHost) {
        // Extract the IP address and use port 3000 for the backend
        const ip = debuggerHost.split(':')[0];
        return `http://${ip}:3000`;
    }

    // Fallbacks for production or environments where hostUri isn't available
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3000'; // Default for Android Emulator
    }
    return 'http://localhost:3000'; // Default for iOS/Web/Local
};

export const API_URL = getBaseUrl();
export const PAYMENTS_URL = `${API_URL}/api/payments`;
export const PAYMENT_TYPES_URL = `${API_URL}/api/payment-types`;
