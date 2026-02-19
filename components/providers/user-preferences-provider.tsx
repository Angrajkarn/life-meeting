"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";
import { useSocket } from "@/lib/socket";
import { toast } from "sonner";

interface NotificationChannelSettings {
    chat: boolean;
    mentions: boolean;
    reactions: boolean;
    apps: boolean;
}

interface MeetingNotificationSettings {
    start_alert: boolean;
    chat_in_meeting: boolean;
    recording_ready: boolean;
}

interface DndSchedule {
    enabled: boolean;
    start_time: string;
    end_time: string;
    week_days: number[];
}

interface NotificationPreferences {
    messages: NotificationChannelSettings;
    meetings: MeetingNotificationSettings;
    email_frequency: string;
    dnd_schedule: DndSchedule;
    sound_enabled: boolean;
    read_receipts: boolean;
    typing_indicators: boolean;
    show_previews: boolean;
}

interface AccessibilityProfile {
    high_contrast: boolean;
    font_scale: number;
    reduced_motion: boolean;
    captions_enabled: boolean;
    caption_language: string;
    sign_language_view: boolean;
    keyboard_mode: string;
    screen_reader_optimized: boolean;
    color_blindness_mode: string;
}

interface UserPreferences {
    confirm_on_leave: boolean;
    app_language: string;
    date_format: string;
    time_format: string;
    translate_to: string;
    translation_handling: string;
    never_translate: string[];
    spellcheck_enabled: boolean;
    open_item_on_enter: boolean;
    suggested_replies: boolean;
    // Appearance
    theme: "light" | "dark" | "system";
    density: "comfy" | "compact";
    high_contrast: boolean; // Deprecated
    reduce_motion: boolean; // Deprecated
    transparent_sidebar: boolean;
    // Notifications
    notifications: NotificationPreferences;
    // Privacy
    privacy: {
        profile_visibility: "public" | "organization" | "none";
        show_online_status: boolean;
        allow_random_meeting_joins: boolean;
        collect_analytics: boolean;
        allow_recording: boolean;
    };
    // Accessibility
    accessibility: AccessibilityProfile;
    [key: string]: any;
}

interface UserPreferencesContextType {
    preferences: UserPreferences;
    updatePreference: (key: keyof UserPreferences, value: any) => Promise<void>;
    isLoading: boolean;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    userId: string | null;
    user: any; // Full user object
    mutate: () => Promise<any>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
    const [preferences, setPreferences] = useState<UserPreferences>({
        confirm_on_leave: true,
        app_language: "en-us",
        date_format: "mdy",
        time_format: "12",
        translate_to: "en",
        translation_handling: "ask",
        never_translate: [],
        spellcheck_enabled: true,
        open_item_on_enter: false,
        suggested_replies: true,
        theme: "light",
        density: "comfy",
        high_contrast: false,
        reduce_motion: false,
        transparent_sidebar: false,
        notifications: {
            messages: { chat: true, mentions: true, reactions: true, apps: true },
            meetings: { start_alert: true, chat_in_meeting: true, recording_ready: true },
            email_frequency: "immediate",
            dnd_schedule: { enabled: false, start_time: "22:00", end_time: "08:00", week_days: [0, 1, 2, 3, 4] },
            sound_enabled: true,
            read_receipts: true,
            typing_indicators: true,
            show_previews: true
        },
        privacy: {
            profile_visibility: "public",
            show_online_status: true,
            allow_random_meeting_joins: false,
            collect_analytics: true,
            allow_recording: true
        },
        accessibility: {
            high_contrast: false,
            font_scale: 1.0,
            reduced_motion: false,
            captions_enabled: false,
            caption_language: "auto",
            sign_language_view: false,
            keyboard_mode: "default",
            screen_reader_optimized: false,
            color_blindness_mode: "none"
        }
    });
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [user, setUser] = useState<any>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const { lastMessage } = useSocket("dashboard", userId || "guest");

    const fetchPreferences = async () => {
        try {
            // We fetch the user profile which contains preferences
            const userData = await api.get("/users/me");
            if (userData.preferences) {
                setPreferences(userData.preferences);
            }
            setUser(userData);
            setUserId(userData.id);
        } catch (err) {
            console.error("Failed to fetch user preferences", err);
            toast.error("Failed to load settings");
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch initial preferences
    useEffect(() => {
        fetchPreferences();
    }, []);

    const mutate = async () => {
        return fetchPreferences();
    };

    // Listen for real-time updates
    useEffect(() => {
        if (lastMessage && lastMessage.type === "user:preferences_updated") {
            setPreferences(prev => ({ ...prev, ...lastMessage.data }));
        }
    }, [lastMessage]);

    // Apply global theme/appearance settings
    useEffect(() => {
        const root = window.document.documentElement;
        
        // Theme
        root.classList.remove("light", "dark");
        if (preferences.theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            root.classList.add(systemTheme);
        } else {
            root.classList.add(preferences.theme);
        }

        // Density
        if (preferences.density === "compact") {
            root.classList.add("density-compact");
        } else {
            root.classList.remove("density-compact");
        }

        // High Contrast
        if (preferences.high_contrast) {
            root.classList.add("high-contrast");
        } else {
            root.classList.remove("high-contrast");
        }

    }, [preferences.theme, preferences.density, preferences.high_contrast]);

    const updatePreference = async (key: keyof UserPreferences, value: any) => {
        // Optimistic update
        setPreferences(prev => ({ ...prev, [key]: value }));
        setSaveStatus('saving');

        try {
            // Construct new preferences object
            const newPreferences = { ...preferences, [key]: value };
            
            // Send PATCH request
            await api.patch("/users/me/preferences", newPreferences);
            setSaveStatus('saved');
            
            // Reset status after a delay
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
            console.error("Failed to save preference", err);
            setSaveStatus('error');
            toast.error("Failed to save changes");
            // Revert on error? For now, we rely on next fetch or manual retry
        }
    };

    return (
        <UserPreferencesContext.Provider value={{ 
            preferences, 
            updatePreference, 
            isLoading, 
            saveStatus, 
            userId,
            user,
            mutate
        }}>
            {children}
        </UserPreferencesContext.Provider>
    );
}

export function useUserPreferences() {
    const context = useContext(UserPreferencesContext);
    if (context === undefined) {
        throw new Error("useUserPreferences must be used within a UserPreferencesProvider");
    }
    return context;
}
