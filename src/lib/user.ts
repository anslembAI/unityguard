"use client";

import { db } from "@/lib/db/schema";

export async function getDisplayName() {
    const existing = await db.settings.get("profile:name");
    if (existing?.value) return String(existing.value);

    const name =
        window.prompt("Enter your display name (neighbors will see this):")?.trim() ||
        "Neighbor";

    await db.settings.put({ key: "profile:name", value: name });
    return name;
}
