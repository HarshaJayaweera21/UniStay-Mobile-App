import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

export default function Header() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.leftSection}>
                <TouchableOpacity 
                    style={styles.menuButton} 
                    activeOpacity={0.7}
                    onPress={() => console.log("Open Drawer/Menu")}
                >
                    <MaterialIcons name="menu" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.brandText}>UniStay</Text>
            </View>

            <View style={styles.rightSection}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>JD</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.four,
        paddingTop: Platform.OS === 'ios' ? 50 : 30, // For status bar spacing if needed
        paddingBottom: Spacing.four,
        backgroundColor: `${Colors.background}CC`, // Transparent background
        borderBottomWidth: 0,
        zIndex: 50,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuButton: {
        padding: Spacing.two,
        borderRadius: 24,
        marginRight: Spacing.two,
        // backgroundColor: Colors.surfaceContainerLow,
    },
    brandText: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 20,
        color: Colors.primary,
        letterSpacing: -0.5,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.secondaryContainer,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.surfaceContainerLowest,
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        color: Colors.primary,
    }
});
