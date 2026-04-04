import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Save item
export const setItem = async (key, value) => {
    if (Platform.OS === 'web') {
        return AsyncStorage.setItem(key, value);
    } else {
        return SecureStore.setItemAsync(key, value);
    }
};

// Get item
export const getItem = async (key) => {
    if (Platform.OS === 'web') {
        return AsyncStorage.getItem(key);
    } else {
        return SecureStore.getItemAsync(key);
    }
};

// Delete item
export const deleteItem = async (key) => {
    if (Platform.OS === 'web') {
        return AsyncStorage.removeItem(key);
    } else {
        return SecureStore.deleteItemAsync(key);
    }
};