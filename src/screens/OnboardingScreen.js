import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { AttendanceStore } from '../services/AttendanceStore';

export default function OnboardingScreen({ onFinish }) {
    const theme = useTheme();
    const [name, setName] = useState('');
    const [projectTitle, setProjectTitle] = useState('');
    const [guideName, setGuideName] = useState('');
    const [cabinNo, setCabinNo] = useState('');

    const handleNext = async () => {
        if (name.trim()) {
            // Save initial data
            await AttendanceStore.initialize(name, projectTitle, guideName, cabinNo);
            onFinish(name);
        } else {
            // Show error or just don't proceed
            alert("Please enter your name");
        }
    };

    return (
        <View style={styles.container}>
            <Text variant="displaySmall" style={{ marginBottom: 20, color: theme.colors.primary, fontWeight: 'bold' }}>
                Welcome to Attendance Tracker
            </Text>

            <View style={styles.inputContainer}>
                <Text style={{ color: theme.colors.secondary, marginBottom: 5 }}>Your Name</Text>
                <TextInput
                    mode="outlined"
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. John Doe"
                    style={styles.input}
                />

                <Text style={{ color: theme.colors.secondary, marginBottom: 5, marginTop: 15 }}>Project Title</Text>
                <TextInput
                    mode="outlined"
                    value={projectTitle}
                    onChangeText={setProjectTitle}
                    placeholder="e.g. AI Attendance"
                    style={styles.input}
                />

                <Text style={{ color: theme.colors.secondary, marginBottom: 5, marginTop: 15 }}>Guide Name</Text>
                <TextInput
                    mode="outlined"
                    value={guideName}
                    onChangeText={setGuideName}
                    placeholder="e.g. Prof. X"
                    style={styles.input}
                />

                <Text style={{ color: theme.colors.secondary, marginBottom: 5, marginTop: 15 }}>Guide Cabin No</Text>
                <TextInput
                    mode="outlined"
                    value={cabinNo}
                    onChangeText={setCabinNo}
                    placeholder="e.g. SJT 101"
                    style={styles.input}
                />
            </View>

            <Button mode="contained" onPress={handleNext} style={styles.button}>
                Get Started
            </Button>

            <View style={{ marginTop: 40, alignItems: 'center' }}>
                <Text variant="bodySmall" style={{ color: theme.colors.outline, textAlign: 'center' }}>
                    Created with ❤️ by RK under the guidance of{"\n"}Rothit “TheTopper” Thiyagarajan
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    inputContainer: {
        marginBottom: 30
    },
    input: {
        marginBottom: 5,
    },
    button: {
        marginTop: 10,
        paddingVertical: 5
    }
});
