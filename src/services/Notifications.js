import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true, // Legacy
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function registerForPushNotificationsAsync() {
    try {
        let token;

        // Skipping remote push token generation for Expo Go to avoid errors
        // real device/build will need this logic restored if PUSH is required.
        // For LOCAL notifications, just channel setup is enough.

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

    } catch (e) {
        console.warn("Notification error:", e);
    }
}

export async function scheduleDailyReminder() {
    // Cancel all before scheduling to avoid duplicates on reload
    await Notifications.cancelAllScheduledNotificationsAsync();

    const title = "Attendance Reminder";
    const body = "It's 9:30 AM! Time to mark your attendance.";

    // Schedule for Monday (2) to Saturday (7)
    for (let weekday = 2; weekday <= 7; weekday++) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: 'default',
            },
            trigger: {
                type: 'weekly', // Explicit type required now
                hour: 9,
                minute: 30,
                weekday: weekday,
                repeats: true,
            },
        });
    }
    console.log("Scheduled notifications Mon-Sat at 9:30 AM");
}


export async function sendTestNotification() {
    try {
        console.log("Starting test notification...");
        const settings = await Notifications.getPermissionsAsync();

        if (!settings.granted && settings.ios?.status !== Notifications.IosAuthorizationStatus.PROVISIONAL) {
            Alert.alert("Permission Issue", `Status: ${settings.status}. Requesting now...`);
            const newSettings = await Notifications.requestPermissionsAsync();
            if (!newSettings.granted) {
                Alert.alert("Error", "Permission definitely denied.");
                return;
            }
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default Channel',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        // Schedule
        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title: "Test Notification 🔔",
                body: "This should appear immediately!",
                sound: 'default', // standard sound
                priority: Notifications.AndroidNotificationPriority.HIGH, // HIGH or MAX
            },
            trigger: null, // Send immediately
        });

        Alert.alert("Sent!", `ID: ${identifier}\nCheck your status bar!`);

    } catch (e) {
        Alert.alert("Error", `Exception: ${e.message}`);
    }
}
