import { Platform } from 'react-native';

// For Android emulator, localhost translates to 10.0.2.2.
// For physical devices, we use the specific machine IP to ensure connectivity.
const getBaseUrl = () => {
    // Priority 1: Physical Device or Expo Go (using machine IP)
    // Priority 2: Android Emulator (10.0.2.2)
    // Priority 3: Web/Local Simulator (localhost)
    
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3000';
    }
    
    // For Web and physical iOS/Android testing via Expo Go
    // Using your specific local IP address to ensure reliable network connection
    return 'http://192.168.1.38:3000';
};

export const API_URL = getBaseUrl();
