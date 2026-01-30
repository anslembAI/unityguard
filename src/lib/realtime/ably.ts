import Ably from "ably";
import { getProfile } from "@/lib/profile";

let client: Ably.Realtime | null = null;

function getClient() {
    if (!client) {
        const profile = getProfile();
        client = new Ably.Realtime({
            authUrl: "/api/ably/auth",
            authParams: { clientId: profile.id },
            autoConnect: true,
        });
    }
    return client;
}

export function getClientId() {
    return getClient().auth.clientId;
}

export function channelName(...parts: string[]) {
    return `unityguard:${parts.join(":")}`;
}

export async function publish(channel: string, name: string, data: unknown) {
    await getClient().channels.get(channel).publish(name, data);
}

export function subscribe(
    channel: string,
    event: string,
    callback: (msg: Ably.Message) => void
) {
    const ch = getClient().channels.get(channel);
    ch.subscribe(event, callback);
    return () => ch.unsubscribe(event, callback);
}

export async function history(channel: string) {
    const result = await getClient().channels.get(channel).history({ limit: 50 });
    return result.items;
}
