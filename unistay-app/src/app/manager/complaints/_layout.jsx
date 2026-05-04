import React from 'react';
import { Stack } from 'expo-router';
import Header from '@/components/Header';

export default function ComplaintsLayout() {
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
            <Stack.Screen name="[id]" />
        </Stack>
    );
}
