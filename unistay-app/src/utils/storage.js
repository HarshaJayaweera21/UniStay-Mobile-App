import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Universal Storage Utility
 * Uses SecureStore on Native (iOS/Android) for encrypted persistent storage
 * Uses localStorage on Web for persistent storage (unencrypted)
 */
const storage = {
  /**
   * Store an item
   * @param {string} key 
   * @param {string} value 
   */
  setItem: async (key, value) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`Storage setItem error for key ${key}:`, error);
    }
  },

  /**
   * Retrieve an item
   * @param {string} key 
   * @returns {Promise<string|null>}
   */
  getItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error(`Storage getItem error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Delete an item
   * @param {string} key 
   */
  deleteItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Storage deleteItem error for key ${key}:`, error);
    }
  }
};

export default storage;
