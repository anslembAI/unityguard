export interface UserProfile {
    id: string;
    displayName: string;
    avatarUrl?: string;
}

const STORAGE_KEY = "unityguard:profile";

function generateId() {
    return typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 9);
}

export function getProfile(): UserProfile {
    if (typeof window === "undefined") {
        return { id: "server", displayName: "Guest" };
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch (err) {
        // ignore
    }

    // Create default profile
    const profile: UserProfile = {
        id: generateId(),
        displayName: `Neighbor ${Math.floor(Math.random() * 10000)}`,
    };

    saveProfile(profile);
    return profile;
}

export function saveProfile(profile: UserProfile) {
    if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
}

export function getDisplayName() {
    return getProfile().displayName;
}

export function getClientId() {
    return getProfile().id;
}
