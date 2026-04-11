import axios, { type AxiosResponse } from "axios";

interface GeoapifyReverseResult {
    formatted: string;
    address_line1: string;
    address_line2: string;
}

interface GeoapifyReverseResponse {
    results: GeoapifyReverseResult[];
}

export const geoapifyClient = axios.create({
    baseURL: "https://api.geoapify.com",
    timeout: 5000,
});

export async function reverseGeocode(
    lat: number,
    lng: number,
): Promise<string> {
    try {
        const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY as
            | string
            | undefined;

        if (!apiKey) {
            throw new Error("Missing Geoapify API key");
        }

        const response: AxiosResponse<GeoapifyReverseResponse> =
            await geoapifyClient.get("/v1/geocode/reverse", {
                params: {
                    lat,
                    lon: lng,
                    format: "json",
                    apiKey,
                },
            });

        if (!response.data.results || response.data.results.length === 0) {
            return "Unknown location";
        }

        return response.data.results[0]?.formatted || "Unknown location";
    } catch {
        throw new Error("Reverse geocoding failed");
    }
}
