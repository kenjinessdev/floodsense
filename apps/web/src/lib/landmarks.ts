export interface Landmark {
    name: string;
    lat: number;
    lng: number;
}

export interface DistrictLandmarks {
    district: string;
    landmarks: Landmark[];
}

export async function loadLandmarks(): Promise<DistrictLandmarks[]> {
    const response = await fetch("/landmarks.json");
    if (!response.ok) {
        throw new Error(
            `Failed to load landmarks.json (${response.status})`,
        );
    }
    const payload = (await response.json()) as {
        districts: Array<{
            district: string;
            landmarks: Array<{ name: string; lat: number; lng: number }>;
        }>;
    };
    if (
        typeof payload !== "object" ||
        !payload ||
        !Array.isArray(payload.districts)
    ) {
        throw new Error("landmarks.json has invalid shape");
    }
    for (const d of payload.districts) {
        if (
            typeof d !== "object" ||
            !d ||
            typeof d.district !== "string" ||
            !Array.isArray(d.landmarks)
        ) {
            throw new Error("landmarks.json has invalid shape");
        }
        for (const lm of d.landmarks) {
            if (
                typeof lm !== "object" ||
                !lm ||
                typeof lm.name !== "string" ||
                typeof lm.lat !== "number" ||
                typeof lm.lng !== "number"
            ) {
                throw new Error("landmarks.json has invalid shape");
            }
        }
    }
    return payload.districts.map((d) => ({
        district: d.district,
        landmarks: d.landmarks.map((lm) => ({
            name: lm.name,
            lat: lm.lat,
            lng: lm.lng,
        })),
    }));
}
