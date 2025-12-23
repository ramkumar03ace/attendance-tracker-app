import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Text, Button, Card, useTheme, IconButton, ProgressBar, Divider } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
// import { useFocusEffect } from '@react-navigation/native'; // Removed unused import
// Since we are using state nav in App.js, we don't have useFocusEffect from navigation prop.
// We will rely on simple useEffect or a prop `refresh` if needed, but since App.js mounts/unmounts, useEffect is fine.

import { AttendanceStore } from '../services/AttendanceStore';
import { registerForPushNotificationsAsync, scheduleDailyReminder } from '../services/Notifications';

export default function DashboardScreen({ navigate, userName }) {
    const theme = useTheme();
    const [data, setData] = useState(null);
    const [stats, setStats] = useState({
        percent: 0,
        phases: [
            { name: "Review I", percent: 0, color: 'grey', attended: 0, conducted: 0, start: "2025-12-06", end: "2025-12-12" },
            { name: "Review II", percent: 0, color: 'grey', attended: 0, conducted: 0, start: "2025-12-13", end: "2026-02-02" }
        ],
        current: { name: "Review I", percent: 0, color: 'grey', attended: 0, conducted: 0, start: "2025-12-06", end: "2025-12-12" }
    });
    const [refreshing, setRefreshing] = useState(false);
    const [projectInfo, setProjectInfo] = useState({ title: '', guide: '', cabin: '' });
    const [isPresent, setIsPresent] = useState(false);
    const [isHoliday, setIsHoliday] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Load data
    // Load data
    const loadStats = async () => {
        try {
            let d = await AttendanceStore.getData();
            if (!d) {
                // Emergency fallback if store is dead
                d = {
                    userName: "Guest",
                    phases: [],
                    attendedDates: [],
                    holidays: [],
                    projectTitle: "Attendance Project",
                    guideName: "Guide Name",
                    cabinNo: ""
                };
            }

            setData(d);
            const s = AttendanceStore.getCalculation(d);

            // Explicitly set stats
            if (s) setStats(s);

            setProjectInfo({
                title: d.projectTitle || "Attendance Project",
                guide: d.guideName || "Guide Name",
                cabin: d.cabinNo || "Cabin No"
            });

            // Check today for button state
            const today = new Date().toISOString().split('T')[0];
            setIsPresent(d.attendedDates ? d.attendedDates.includes(today) : false);
            setIsHoliday(d.holidays ? d.holidays.includes(today) : false);
        } catch (error) {
            console.log("LoadStats Failed", error);
        }
    };

    React.useEffect(() => {
        loadStats();
        // Ask for permission and schedule once on dashboard load (idempotent)
        setupNotifications();
    }, []);

    const setupNotifications = async () => {
        try {
            await registerForPushNotificationsAsync();
            await scheduleDailyReminder();
        } catch (e) {
            console.log("Notification setup failed:", e);
        }
    };

    const handleMark = async () => {
        const today = new Date().toISOString().split('T')[0]; // Re-derive today for marking
        // If holiday, maybe ask to remove holiday first? Or just mark allowed.
        const newData = await AttendanceStore.markAttendance(today);
        // After marking, reload all stats to update UI
        loadStats();
    };

    // Pull to refresh
    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        loadStats().then(() => setRefreshing(false));
    }, []);

    // Calculate Progress Color
    const progressColor = stats.percent >= 75 ? theme.colors.secondary : theme.colors.error;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text variant="headlineMedium" style={{ color: theme.colors.onBackground, fontWeight: 'bold', marginBottom: 5 }}>
                        Hello, {userName ? userName.split(' ')[0] : "User"} 👋
                    </Text>

                </View>
                <View style={{ flexDirection: 'row' }}>
                    <IconButton icon="calendar" mode="contained" onPress={() => navigate('calendar')} />
                    <IconButton icon="cog" mode="outlined" onPress={() => navigate('settings')} />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
            >


                {/* Current Phase Main Status */}
                {/* Current Phase Main Status */}
                {/* Unconditional Render to guarantee visibility */}
                <Card style={styles.card}>
                    <Card.Content style={{ alignItems: 'center' }}>
                        <Text variant="titleLarge" style={{ marginBottom: 5 }}>
                            {stats.current ? stats.current.name : (stats.phases[0] ? stats.phases[0].name : "Loading...")}
                        </Text>
                        <Text variant="bodySmall" style={{ color: 'grey' }}>
                            {stats.current ? `${stats.current.start} to ${stats.current.end}` : (stats.phases[0] ? `${stats.phases[0].start} to ${stats.phases[0].end}` : "")}
                        </Text>

                        <View style={styles.circleContainer}>
                            <Text variant="displayLarge" style={{ color: stats.current ? stats.current.color : theme.colors.primary, fontWeight: 'bold' }}>
                                {stats.current ? stats.current.percent : (stats.phases[0] ? stats.phases[0].percent : 0)}%
                            </Text>
                            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>Target: 75%</Text>
                        </View>

                        <ProgressBar progress={stats.current && stats.current.percent ? stats.current.percent / 100 : 0} color={stats.current ? stats.current.color : 'grey'} style={styles.bar} />

                        {/* Analysis & Chart */}
                        {stats.current && stats.current.total > 0 && (
                            <View style={{ alignItems: 'center', width: '100%', marginTop: 10 }}>
                                <View style={styles.chartContainer}>
                                    <PieChart
                                        data={[
                                            { name: 'Attended', population: stats.current.attended, color: stats.current.color, legendFontColor: '#7F7F7F', legendFontSize: 12 },
                                            { name: 'Absent', population: stats.current.conducted - stats.current.attended, color: '#F44336', legendFontColor: '#7F7F7F', legendFontSize: 12 },
                                            { name: 'Future', population: Math.max(0, stats.current.total - stats.current.conducted), color: '#E0E0E0', legendFontColor: '#7F7F7F', legendFontSize: 12 }
                                        ]}
                                        width={Dimensions.get("window").width - 80}
                                        height={180}
                                        chartConfig={{
                                            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                        }}
                                        accessor={"population"}
                                        backgroundColor={"transparent"}
                                        paddingLeft={"15"}
                                        absolute
                                    />
                                </View>

                                <Divider style={{ width: '100%', marginVertical: 10 }} />

                                {/* Advice Text */}
                                <View style={{ alignItems: 'center', marginVertical: 5 }}>
                                    {stats.current.needed > 0 ? (
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={{ color: theme.colors.error, fontWeight: 'bold', textAlign: 'center' }}>
                                                ⚠️ You must attend {stats.current.needed} more days to restore 75%.
                                            </Text>
                                            {stats.current.needed50 > 0 && (
                                                <Text style={{ color: theme.colors.error, fontWeight: 'bold', textAlign: 'center', marginTop: 5 }}>
                                                    ⚠️ You must attend {stats.current.needed50} more days to restore 50%.
                                                </Text>
                                            )}
                                        </View>
                                    ) : (
                                        stats.current.canSkip > 0 ? (
                                            <Text style={{ color: theme.colors.primary, fontWeight: 'bold', textAlign: 'center' }}>
                                                ✅ Safe! You can afford to skip {stats.current.canSkip} more days.
                                            </Text>
                                        ) : (
                                            <Text style={{ color: '#FFC107', fontWeight: 'bold', textAlign: 'center' }}>
                                                ⚠️ Careful! You are on the edge. Do not miss any more classes.
                                            </Text>
                                        )
                                    )}
                                </View>
                            </View>
                        )}


                    </Card.Content>
                </Card>

                {/* Overall Summary Card */}
                <Card style={[styles.card, { marginBottom: 20 }]}>
                    <Card.Content style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Overall Average</Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>Across all phases</Text>
                        </View>
                        <Text variant="displaySmall" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                            {(() => {
                                const totalAttended = stats.phases.reduce((acc, p) => acc + p.attended, 0);
                                const totalConducted = stats.phases.reduce((acc, p) => acc + p.conducted, 0);
                                return totalConducted > 0 ? ((totalAttended / totalConducted) * 100).toFixed(1) : "0.0";
                            })()}%
                        </Text>
                    </Card.Content>
                </Card>

                {/* Action Area */}
                <View style={styles.actionContainer}>
                    <Text variant="titleMedium" style={{ marginBottom: 10, textAlign: 'center', fontWeight: 'bold' }}>
                        Today: {currentTime.toDateString()} {currentTime.toLocaleTimeString()}
                    </Text>

                    {isHoliday ? (
                        <Button mode="contained-tonal" icon="beach" disabled style={styles.actionButton}>
                            Today is Holiday
                        </Button>
                    ) : (
                        <Button
                            mode="contained"
                            onPress={handleMark}
                            style={[styles.actionButton, isPresent ? { backgroundColor: theme.colors.secondaryContainer } : {}]}
                            labelStyle={isPresent ? { color: theme.colors.onSecondaryContainer } : {}}
                            icon={isPresent ? "check-circle" : "fingerprint"}
                        >
                            {isPresent ? "Marked Present" : "Mark Attendance"}
                        </Button>
                    )}
                </View>

                {/* Other Phases Compact */}
                <Text variant="titleMedium" style={{ marginTop: 20, marginBottom: 5 }}>All Phases</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                    {stats.phases && stats.phases.map((p, i) => (
                        <Card key={i} style={{ width: 160, marginRight: 10, opacity: p.isCurrent ? 1 : 0.7 }}>
                            <Card.Content>
                                <Text variant="titleSmall" numberOfLines={1}>{p.name}</Text>
                                <Text variant="displaySmall" style={{ color: p.color }}>{p.percent}%</Text>
                                <Text variant="labelSmall">{p.attended}/{p.conducted} Days</Text>
                            </Card.Content>
                        </Card>
                    ))}
                </ScrollView>


                {/* Action Area */}


                {/* Recommendation -- Merged into Main Card Logic but kept here if global recs needed */}
                {/* Removed redundant generic recommendation card, using Phase specific status instead */}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    scroll: {
        paddingBottom: 40,
    },
    card: {
        marginBottom: 10,
    },
    circleContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    bar: {
        height: 10,
        borderRadius: 5,
        width: '100%',
        marginVertical: 10,
        backgroundColor: '#333'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    actionContainer: {
        marginVertical: 20,
        alignItems: 'center',
    },
    actionButton: {
        width: '100%',
        paddingVertical: 6,
    }
});
