import AsyncStorage from '@react-native-async-storage/async-storage';

const STORE_KEY = 'attendance_data';
const TARGET_PERCENTAGE = 75.0;

// Default Phases
// Review I: 2025-12-06 to 2025-12-12
// Review II: 2025-12-13 to 2026-02-02
// Final Review: 2026-02-03 to 2026-04-27
const DEFAULT_PHASES = [
    { name: "Review I", start: "2025-12-06", end: "2025-12-12" },
    { name: "Review II", start: "2025-12-13", end: "2026-02-02" },
    { name: "Final Review", start: "2026-02-03", end: "2026-04-27" }
];

export const AttendanceStore = {
    // Data Structure:
    // {
    //   userName: string,
    //   startDate: string (ISO Date) - effectively Phase 1 start,
    //   phases: {name, start, end}[],
    //   attendedDates: string[], 
    //   holidays: string[] 
    // }

    getData: async () => {
        try {
            const json = await AsyncStorage.getItem(STORE_KEY);
            let data = json != null ? JSON.parse(json) : null;

            // Migration & Auto-healing
            if (data) {
                // Ensure Phases
                if (!data.phases || !Array.isArray(data.phases) || data.phases.length === 0) {
                    data.phases = JSON.parse(JSON.stringify(DEFAULT_PHASES));
                } else {
                    // Force update logic if needed, but let's just ensure it exists for now
                    // actually user wanted exact dates, so let's force overwrite
                    data.phases = JSON.parse(JSON.stringify(DEFAULT_PHASES));
                }

                // Ensure Arrays
                if (!data.attendedDates) data.attendedDates = [];
                if (!data.holidays) data.holidays = [];

                // Ensure Project Info
                if (!data.projectTitle) data.projectTitle = "";
                if (!data.guideName) data.guideName = "";
                if (!data.cabinNo) data.cabinNo = "";

                // Save back fixed data
                await AsyncStorage.setItem(STORE_KEY, JSON.stringify(data));
            } else {
                // Create Default if null
                data = {
                    userName: "User",
                    projectTitle: "",
                    guideName: "",
                    cabinNo: "",
                    phases: JSON.parse(JSON.stringify(DEFAULT_PHASES)),
                    attendedDates: [],
                    holidays: []
                };
            }
            return data;
        } catch (e) {
            console.error(e);
            return null;
        }
    },

    initialize: async (name, projectTitle, guideName, cabinNo) => {
        // Assume default phases always apply.
        const phases = JSON.parse(JSON.stringify(DEFAULT_PHASES));

        const data = {
            userName: name,
            projectTitle: projectTitle || "", // Ensure string
            guideName: guideName || "",
            cabinNo: cabinNo || "",
            startDate: phases[0].start, // Just metadata
            phases: phases,
            attendedDates: [],
            holidays: []
        };
        // Force write, overwriting any previous "attendance_data"
        await AsyncStorage.setItem(STORE_KEY, JSON.stringify(data));
        // Also save userName separately if needed by App.js check
        await AsyncStorage.setItem('userName', name);
        return data;
    },

    markAttendance: async (dateStr) => {
        // dateStr should be YYYY-MM-DD
        const data = await AttendanceStore.getData();
        if (!data) return;

        // Toggle: if exists, remove. If not, add.
        const index = data.attendedDates.indexOf(dateStr);
        if (index > -1) {
            data.attendedDates.splice(index, 1);
        } else {
            data.attendedDates.push(dateStr);
        }

        await AsyncStorage.setItem(STORE_KEY, JSON.stringify(data));
        return data;
    },

    addHoliday: async (dateStr) => {
        const data = await AttendanceStore.getData();
        if (!data) return;
        if (!data.holidays.includes(dateStr)) {
            data.holidays.push(dateStr);
            await AsyncStorage.setItem(STORE_KEY, JSON.stringify(data));
        }
        return data;
    },

    removeHoliday: async (dateStr) => {
        const data = await AttendanceStore.getData();
        if (!data) return;
        const index = data.holidays.indexOf(dateStr);
        if (index > -1) {
            data.holidays.splice(index, 1);
            await AsyncStorage.setItem(STORE_KEY, JSON.stringify(data));
        }
        return data;
    },

    updateProjectDetails: async (title, guide, cabin) => {
        const data = await AttendanceStore.getData();
        if (!data) return;
        data.projectTitle = title;
        data.guideName = guide;
        data.cabinNo = cabin;
        await AsyncStorage.setItem(STORE_KEY, JSON.stringify(data));
        return data;
    },

    // Helper to generate dates
    getDatesInRange: (startDate, endDate) => {
        const dates = [];
        let current = new Date(startDate);
        // Target is YYYY-MM-DD
        let currentStr = current.toISOString().split('T')[0];

        // Safety: 1000 days max
        let safety = 0;

        // Use string compare: "2025-12-23" <= "2025-12-25" works
        while (currentStr <= endDate && safety < 1000) {
            dates.push(currentStr);
            // Increment
            current.setDate(current.getDate() + 1);
            currentStr = current.toISOString().split('T')[0];
            safety++;
        }
        return dates;
    },

    addHolidayRange: async (startStr, endStr) => {
        const data = await AttendanceStore.getData();
        if (!data) return;

        const range = AttendanceStore.getDatesInRange(startStr, endStr);
        range.forEach(date => {
            if (!data.holidays.includes(date)) {
                data.holidays.push(date);
            }
            // Optional: Remove from attended if exists?
            // const idx = data.attendedDates.indexOf(date);
            // if(idx > -1) data.attendedDates.splice(idx, 1);
        });

        await AsyncStorage.setItem(STORE_KEY, JSON.stringify(data));
        return data;
    },

    markAttendanceRange: async (startStr, endStr) => {
        const data = await AttendanceStore.getData();
        if (!data) return;

        const range = AttendanceStore.getDatesInRange(startStr, endStr);
        range.forEach(date => {
            // Only add if not holiday? User might want to force it.
            // Let's just add it.
            if (!data.attendedDates.includes(date)) {
                data.attendedDates.push(date);
            }
        });

        await AsyncStorage.setItem(STORE_KEY, JSON.stringify(data));
        return data;
    },

    getCalculation: (data) => {
        // If no data, use default empty structure to prevent UI blankness
        if (!data) {
            data = {
                phases: JSON.parse(JSON.stringify(DEFAULT_PHASES)),
                attendedDates: [],
                holidays: []
            };
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // -- Removed legacy global calculation logic which relied on data.startDate --
        // We now rely purely on Phases.

        // Fail-safe: Use defaults if data.phases is empty
        const phasesToUse = (data && data.phases && Array.isArray(data.phases) && data.phases.length > 0)
            ? data.phases
            : JSON.parse(JSON.stringify(DEFAULT_PHASES));

        // Debug: ensure we have phases
        if (phasesToUse.length === 0) {
            phasesToUse.push(...JSON.parse(JSON.stringify(DEFAULT_PHASES)));
        }

        const results = phasesToUse.map((phase, index) => {
            // Validate Phase Integrity
            if (!phase.start || !phase.end) {
                // Determine default for this index if possible, or use generic
                const def = DEFAULT_PHASES[index] || DEFAULT_PHASES[0];
                phase.start = def.start;
                phase.end = def.end;
                phase.name = phase.name || def.name;
            }

            const start = new Date(phase.start);
            const end = new Date(phase.end);
            // End date is Inclusive for the phase? Yes "till Review II". 
            // Let's assume inclusive.

            // Loop for this phase
            let daysConducted = 0;
            let attendedCount = 0;
            // Iterate day by day
            const loop = new Date(start);

            // Fix: Use String comparison for current phase to avoid Timezone mishaps
            const nowStr = new Date().toISOString().split('T')[0]; // Fresh 'now'
            const isCurrentPhase = (nowStr >= phase.start && nowStr <= phase.end);

            let isFuture = nowStr < phase.start;
            let isPast = nowStr > phase.end;

            // Calculate 'Total Expected Working Days' in this phase (Budget)
            // We need to know TOTAL working days for the phase to enable "Remaining" logic.
            // We loop from start to END.
            // (Fixed re-declaration issue)
            // Force update
            // Fixed re-declaration
            let totalWorkingDays = 0;
            let currentLoop = new Date(start);
            let loopCount = 0; // Safety break

            while (currentLoop <= end && loopCount < 500) {
                loopCount++;
                const dStr = currentLoop.toISOString().split('T')[0];
                const day = currentLoop.getDay();
                const isSun = (day === 0);
                // Safe access
                const isHol = data.holidays ? data.holidays.includes(dStr) : false;

                if (!isSun && !isHol) {
                    totalWorkingDays++;
                    // If this day is in the past/today, it counts as 'Conducted'
                    if (currentLoop <= now) {
                        daysConducted++;
                    }
                }
                // Count attended
                // Safe access
                if (data.attendedDates && data.attendedDates.includes(dStr)) {
                    // Check if it was valid day? Even if holiday, if marked present, count it?
                    // Store logic allows marking holidays. Let's count it.
                    // But strictly should check bounds.
                    if (currentLoop <= end && currentLoop >= start) attendedCount++;
                }

                // Properly increment day
                currentLoop = new Date(currentLoop); // Ensure new instance
                currentLoop.setDate(currentLoop.getDate() + 1);
            }

            // Calculations
            // Conducted Logic: If future, daysConducted is 0.
            const denominator = daysConducted > 0 ? daysConducted : 1;
            // Note: If phase hasn't started, percent is 0/1 * 100 = 0? Or 100?
            // If future, let's say 100% or 0%?
            const percent = daysConducted > 0 ? ((attendedCount / daysConducted) * 100) : 0;

            // Recommendation
            // Recommendation
            const minReq = Math.ceil(totalWorkingDays * 0.75);
            // Recommendation 50%
            const minReq50 = Math.ceil(totalWorkingDays * 0.50);

            // Total days you can afford to miss across the whole phase
            const maxAbsence = totalWorkingDays - minReq;
            // Days missed so far
            const currentAbsence = daysConducted - attendedCount;
            // Remaining skips allowed
            const canSkip = Math.max(0, maxAbsence - currentAbsence);

            const needed = Math.max(0, minReq - attendedCount);
            const needed50 = Math.max(0, minReq50 - attendedCount);

            // Color Scheme: < 50 Red, 50-75 Yellow, >= 75 Green
            let color = "#CF6679"; // Red default (< 50)
            if (percent >= 75) {
                color = "#4CAF50"; // Green
            } else if (percent >= 50) {
                color = "#FFC107"; // Yellow
            }

            let status = "";
            if (isFuture) {
                status = "Starts " + phase.start;
                color = "grey";
            } else {
                if (needed <= 0) {
                    status = "Safe";
                    // Keep established color
                } else {
                    status = "Shortage";
                }
            }

            if (isCurrentPhase) {
                // Keep the calculated color but maybe highlight border?
                // For now, let the progress bar show the color.
            }

            return {
                name: phase.name,
                percent: parseFloat(percent.toFixed(1)),
                attended: attendedCount,
                conducted: daysConducted,
                total: totalWorkingDays,
                status,
                color, // Now dynamic
                isCurrent: isCurrentPhase,
                start: phase.start,
                end: phase.end,
                needed,
                needed50,
                canSkip
            };
        });



        // Overall Active
        const currentPhase = results.find(r => r.isCurrent) || results[0]; // Default to first if all past/future?

        return {
            phases: results,
            current: currentPhase
        };
    }
};
