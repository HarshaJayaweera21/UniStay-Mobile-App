import React from 'react';
import { Stack } from 'expo-router';
import Header from '@/components/Header';

export default function StudentLayout() {
    return (
        <Stack
            screenOptions={{
                header: () => <Header />,
                headerShown: true,
                contentStyle: { backgroundColor: '#faf8ff' },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="room-index" />
            <Stack.Screen name="room-details" />
            <Stack.Screen name="my-room" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="edit-profile" />
        </Stack>
    );
}
