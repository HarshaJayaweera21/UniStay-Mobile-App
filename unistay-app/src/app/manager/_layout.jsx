import React from 'react';
import { Stack } from 'expo-router';

export default function ManagerLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#faf8ff' },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="room-index" />
            <Stack.Screen name="add-room" />
            <Stack.Screen name="edit-room" />
            <Stack.Screen name="room-details" />
        </Stack>
    );
}
