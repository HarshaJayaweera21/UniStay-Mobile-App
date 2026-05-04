import React from 'react';
import { Stack } from 'expo-router';
import Header from '@/components/Header';

export default function AnnouncementsLayout() {
    return (
        <Stack
            screenOptions={{
                header: () => <Header showBackButton={true} />,
                headerShown: true,
                contentStyle: { backgroundColor: '#faf8ff' },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="manage" />
            <Stack.Screen name="view" />
        </Stack>
    );
}
