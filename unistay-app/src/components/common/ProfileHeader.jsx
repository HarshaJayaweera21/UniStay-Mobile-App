import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../../constants/colors';
import { Fonts, Radius, Spacing } from '../../constants/theme';
import useAuth from '../../hooks/useAuth';

const ProfileHeader = () => {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <View style={styles.container}>
            {user.profilePicture ? (
                <Image
                    source={{ uri: user.profilePicture }}
                    style={styles.avatar}
                />
            ) : (
                <View style={[styles.avatar, styles.placeholderAvatar]}>
                    <Text style={styles.avatarText}>{user.firstName?.charAt(0).toUpperCase()}</Text>
                </View>
            )}
            <View style={styles.textContainer}>
                <Text style={styles.greeting}>Hello, {user.firstName}</Text>
                <Text style={styles.role}>{user.role}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        backgroundColor: Colors.surfaceContainerLowest,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: Radius.full,
        backgroundColor: Colors.surfaceVariant,
    },
    placeholderAvatar: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primaryContainer,
    },
    avatarText: {
        fontFamily: Fonts.headlineSemiBold,
        fontSize: 20,
        color: Colors.onPrimaryContainer,
    },
    textContainer: {
        marginLeft: Spacing.three,
        justifyContent: 'center',
    },
    greeting: {
        fontFamily: Fonts.headlineSemiBold,
        fontSize: 18,
        color: Colors.onSurface,
    },
    role: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.onSurfaceVariant,
        textTransform: 'capitalize',
    },
});

export default ProfileHeader;
