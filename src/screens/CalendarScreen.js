import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { Text, List, Button, Portal, Dialog, TextInput, IconButton, useTheme, Chip } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AttendanceStore } from '../services/AttendanceStore';

export default function CalendarScreen({ navigate }) {
    const theme = useTheme();
    const [data, setData] = useState(null);
    const [visible, setVisible] = useState(false); // Dialog
    const [dialogMode, setDialogMode] = useState('holiday'); // 'holiday' | 'present'
    const [holidayDate, setHolidayDate] = useState('');
    const [endDate, setEndDate] = useState(''); // Optional End Date for range

    // Picker States
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const loadData = async () => {
        const d = await AttendanceStore.getData();
        setData(d);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async () => {
        if (!holidayDate) {
            Alert.alert("Required", "Please select a start date.");
            return;
        }

        // Ensure date format YYYY-MM-DD
        const start = holidayDate.split('T')[0];
        const end = endDate ? endDate.split('T')[0] : null;

        if (dialogMode === 'holiday') {
            if (end) {
                await AttendanceStore.addHolidayRange(start, end);
            } else {
                await AttendanceStore.addHoliday(start);
            }
        } else {
            // Mark Present
            if (end) {
                await AttendanceStore.markAttendanceRange(start, end);
            } else {
                const current = await AttendanceStore.getData();
                if (!current.attendedDates.includes(start)) {
                    await AttendanceStore.markAttendance(start);
                }
            }
        }

        setHolidayDate('');
        setEndDate('');
        setVisible(false);
        loadData();
    };

    const toLocalDateStr = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const openDialog = (mode) => {
        setDialogMode(mode);
        // Default to today (Local)
        const today = toLocalDateStr(new Date());
        setHolidayDate(today);
        setEndDate('');
        setVisible(true);
    };

    const onDateChange = (event, selectedDate, isStart) => {
        const currentDate = selectedDate;

        if (Platform.OS === 'android') {
            if (isStart) setShowStartPicker(false);
            else setShowEndPicker(false);
        }

        if (event.type === 'set' && currentDate) {
            // Use local date string
            const dateStr = toLocalDateStr(currentDate);
            if (isStart) {
                setHolidayDate(dateStr);
            } else {
                setEndDate(dateStr);
            }
        }
    };

    const handleDeleteHoliday = async (date) => {
        Alert.alert("Delete Holiday", `Remove ${date}?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: 'destructive',
                onPress: async () => {
                    await AttendanceStore.removeHoliday(date);
                    loadData();
                }
            }
        ]);
    };

    const handleDeleteAttendance = async (date) => {
        Alert.alert("Remove Attendance", `Mark ${date} as absent?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove",
                style: 'destructive',
                onPress: async () => {
                    await AttendanceStore.markAttendance(date); // Toggles it off
                    loadData();
                }
            }
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <IconButton icon="arrow-left" onPress={() => navigate('dashboard')} />
                <Text variant="headlineSmall">History & Holidays</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                    <Button mode="outlined" onPress={() => openDialog('holiday')} icon="calendar-plus" style={{ flex: 1 }}>
                        Add Holiday
                    </Button>
                    <Button mode="outlined" onPress={() => openDialog('present')} icon="check-bold" style={{ flex: 1 }}>
                        Add Past
                    </Button>
                </View>

                <Text variant="titleMedium" style={{ marginBottom: 10, color: theme.colors.tertiary }}>Upcoming/Past Holidays</Text>
                <View style={styles.chipContainer}>
                    {data?.holidays?.map(h => (
                        <Chip key={h} icon="beach" style={{ margin: 4 }} onClose={() => handleDeleteHoliday(h)}>
                            {h}
                        </Chip>
                    ))}
                    {(!data?.holidays || data.holidays.length === 0) && <Text style={{ color: theme.colors.outline }}>No holidays set.</Text>}
                </View>

                <Text variant="titleMedium" style={{ marginTop: 20, marginBottom: 10, color: theme.colors.primary }}>Attendance Log</Text>
                {data?.attendedDates?.sort().reverse().map(date => (
                    <List.Item
                        key={date}
                        title={date}
                        left={props => <List.Icon {...props} icon="check-circle" color={theme.colors.secondary} />}
                        right={props => <IconButton {...props} icon="delete" onPress={() => handleDeleteAttendance(date)} />}
                        style={{ backgroundColor: theme.colors.elevation.level1, marginBottom: 5, borderRadius: 8 }}
                    />
                ))}
            </ScrollView>

            <Portal>
                <Dialog visible={visible} onDismiss={() => setVisible(false)}>
                    <Dialog.Title>{dialogMode === 'holiday' ? "Add Holiday" : "Mark Present"}</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodySmall" style={{ color: theme.colors.outline }}>Start Date</Text>
                        <TouchableOpacity onPress={() => setShowStartPicker(true)}>
                            <TextInput
                                pointerEvents="none"
                                value={holidayDate}
                                mode="outlined"
                                editable={false}
                                right={<TextInput.Icon icon="calendar" />}
                            />
                        </TouchableOpacity>

                        <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 10 }}>End Date (Optional)</Text>
                        <TouchableOpacity onPress={() => setShowEndPicker(true)}>
                            <TextInput
                                pointerEvents="none"
                                value={endDate}
                                mode="outlined"
                                editable={false}
                                placeholder="Single Day"
                                right={<TextInput.Icon icon="calendar-range" />}
                            />
                        </TouchableOpacity>

                        {/* Pickers */}
                        {showStartPicker && (
                            <DateTimePicker
                                value={holidayDate ? new Date(holidayDate) : new Date()}
                                mode="date"
                                display="default"
                                onChange={(e, d) => onDateChange(e, d, true)}
                            />
                        )}
                        {showEndPicker && (
                            <DateTimePicker
                                value={endDate ? new Date(endDate) : new Date()}
                                mode="date"
                                display="default"
                                onChange={(e, d) => onDateChange(e, d, false)}
                                minimumDate={new Date(holidayDate)}
                            />
                        )}

                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setVisible(false)}>Cancel</Button>
                        <Button onPress={handleSave}>{dialogMode === 'holiday' ? "Add" : "Mark"}</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 40, paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    scroll: { paddingBottom: 50 },
});
