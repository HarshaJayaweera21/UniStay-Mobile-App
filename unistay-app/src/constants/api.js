import { Platform } from 'react-native';

// For Android emulator, localhost translates to 10.0.2.2.
// For Web or iOS simulator, it remains localhost.
const getBaseUrl = () => {
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3000';
    }
    return 'http://localhost:3000';
};

export const API_URL = getBaseUrl();
