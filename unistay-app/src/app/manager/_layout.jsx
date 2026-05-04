import React from 'react';
import { Stack } from 'expo-router';
import Header from '@/components/Header';

export default function ManagerLayout() {
    return (
        <Stack
            screenOptions={{
                header: () => <Header />,
                headerShown: true,
                contentStyle: { backgroundColor: '#faf8ff' },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="room-index" />
            <Stack.Screen name="requests" />
            <Stack.Screen name="payments" />
            <Stack.Screen name="add-room" />
            <Stack.Screen name="edit-room" />
            <Stack.Screen name="room-details" />
            <Stack.Screen name="leave-requests" />
            <Stack.Screen name="leave-history" />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        </Stack>
    );
}
