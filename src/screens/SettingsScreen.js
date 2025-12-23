import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, IconButton, useTheme, Card, Divider, Dialog, Portal } from 'react-native-paper';
import { AttendanceStore } from '../services/AttendanceStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SettingsScreen({ navigate }) {
    const theme = useTheme();
    const [projectData, setProjectData] = useState({ title: '', guide: '', cabin: '' });
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const data = await AttendanceStore.getData();
        if (data) {
            setProjectData({
                title: data.projectTitle || "",
                guide: data.guideName || "",
                cabin: data.cabinNo || ""
            });
        }
        setLoading(false);
    };



    const clearData = async () => {
        Alert.alert(
            "Reset App",
            "Are you sure? This will delete all attendance history.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        await AsyncStorage.clear();
                        navigate('onboarding');
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <IconButton icon="arrow-left" onPress={() => navigate('dashboard')} />
                <Text variant="headlineSmall">Settings & Info</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text variant="titleMedium" style={{ marginLeft: 5, color: theme.colors.secondary }}>VIT University</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.outline, marginRight: 5 }}>Winter Semester 2025-26</Text>
                </View>

                {/* Read-Only Guide Details */}
                <Card style={[styles.card, { marginBottom: 20 }]}>
                    <Card.Title title="My Project Details" left={(props) => <IconButton icon="account-details" {...props} />} />
                    <Card.Content>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>BCSE498J - Project - II</Text>


                        <Text variant="bodySmall" style={{ color: theme.colors.outline }}>Project Title</Text>
                        <Text variant="bodyMedium" style={{ fontWeight: 'bold', marginBottom: 10 }}>{projectData.title}</Text>
                        <Divider />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                            <View style={{ flex: 1 }}>
                                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>Guide Name</Text>
                                <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>{projectData.guide}</Text>
                            </View>
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>Cabin / Hours</Text>
                                <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>{projectData.cabin}</Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>



                <Card style={styles.card}>
                    <Card.Title title="General Info" left={(props) => <IconButton icon="school" {...props} />} />
                    <Card.Content>
                        <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>Project Coordinators:</Text>
                        <Text variant="bodySmall">Prof. G. Anuradha & Prof. B. Kalaavathi</Text>
                        <Divider style={{ marginVertical: 10 }} />

                        {/* Moved Open Hours Here as Requested */}
                        <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>Open Hours:</Text>
                        <Text variant="bodySmall">SJT 323 (Mon 2:00 PM - 4:00 PM)</Text>
                        <Divider style={{ marginVertical: 10 }} />

                        <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>Biometric Location:</Text>
                        <Text variant="bodySmall">SJT 3rd/4th/5th Floor</Text>
                        <Text variant="bodySmall">Time: 8:30 AM - 9:30 AM</Text>
                        <Divider style={{ marginVertical: 10 }} />

                        <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>Semester Start Date:</Text>
                        <Text variant="bodySmall">06-12-2025</Text>

                    </Card.Content>
                </Card>

                {/* Date Editor Placeholder - Basic for now */}
                {/*
        <Card style={styles.card}>
             <Card.Title title="Configuration" />
             <Button onPress={() => setShowPicker(true)}>Change Start Date</Button>
        </Card>
        */}

                <Card style={[styles.card, { marginTop: 20 }]}>
                    <Card.Title title="Important Dates" />
                    <Card.Content>
                        <View style={styles.row}>
                            <Text variant="bodyMedium">Review I:</Text>
                            <Text variant="bodyMedium">10-12-2025</Text>
                        </View>
                        <View style={styles.row}>
                            <Text variant="bodyMedium">Review II:</Text>
                            <Text variant="bodyMedium">02-02-2026</Text>
                        </View>
                        <View style={styles.row}>
                            <Text variant="bodyMedium">Report Submission:</Text>
                            <Text variant="bodyMedium">16-04-2026</Text>
                        </View>
                        <View style={styles.row}>
                            <Text variant="bodyMedium">Final Review:</Text>
                            <Text variant="bodyMedium">27-04-2026</Text>
                        </View>
                    </Card.Content>
                </Card>

                <Button
                    mode="outlined"
                    icon="bell-ring"
                    onPress={() => require('../services/Notifications').sendTestNotification()}
                    style={{ marginTop: 20 }}
                >
                    Test Notification (Wait 2s)
                </Button>

                <Button
                    mode="contained-tonal"
                    icon="delete"
                    onPress={clearData}
                    textColor={theme.colors.error}
                    style={{ marginTop: 20 }}
                >
                    Reset All Data
                </Button>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 40, paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    scroll: { paddingBottom: 50 },
    card: { marginBottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }
});
