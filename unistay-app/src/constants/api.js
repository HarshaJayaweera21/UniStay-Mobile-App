import { Platform } from 'react-native';

// Use your laptop's local network IP so physical devices (Expo Go) can reach the backend.
// For web, localhost works since the browser runs on the same machine.
// IMPORTANT: Update this IP if your WiFi network changes.
const getBaseUrl = () => {
    if (Platform.OS === 'web') {
        return 'http://localhost:3000';
    }
    // Your laptop's LAN IP (from Expo's Metro output)
    return 'http://10.148.98.28:3000';
};

export const API_URL = getBaseUrl();
