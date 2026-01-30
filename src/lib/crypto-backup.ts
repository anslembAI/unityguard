// WebCrypto-based encrypted backup (AES-GCM + PBKDF2)
// Works in modern browsers. Keep passphrase client-only.

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64(u8: Uint8Array) {
    let s = "";
    u8.forEach((b) => (s += String.fromCharCode(b)));
    return btoa(s);
}

function fromB64(b64: string) {
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return u8;
}

async function deriveKey(passphrase: string, salt: Uint8Array) {
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(passphrase),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            salt: salt as any,
            iterations: 200_000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export type BackupEnvelope = {
    v: 1;
    createdAt: number;
    salt: string; // base64
    iv: string; // base64
    ciphertext: string; // base64
};

export async function encryptJson(passphrase: string, payload: unknown): Promise<Blob> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);

    const plaintext = enc.encode(JSON.stringify(payload));
    const ctBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

    const envelope: BackupEnvelope = {
        v: 1,
        createdAt: Date.now(),
        salt: toB64(salt),
        iv: toB64(iv),
        ciphertext: toB64(new Uint8Array(ctBuf)),
    };

    return new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
}

export async function decryptJson<T = unknown>(passphrase: string, blobText: string): Promise<T> {
    const envelope = JSON.parse(blobText) as BackupEnvelope;

    if (envelope.v !== 1) throw new Error("Unsupported backup version.");

    const salt = fromB64(envelope.salt);
    const iv = fromB64(envelope.iv);
    const ciphertext = fromB64(envelope.ciphertext);

    const key = await deriveKey(passphrase, salt);

    const ptBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    const json = dec.decode(new Uint8Array(ptBuf));
    return JSON.parse(json) as T;
}
