import axios from "axios";

export interface ModelPrediction {
    prediction: number;
    probability: number;
    risk_level: string;
    label: string;
    override: boolean;
    override_reason: string | null;
}

export interface ExtractedValues {
    Elevation: number;
    Rainfall: number;
    Slope: number;
    Profile_Curvature: number;
    LULC: number;
    Lithology: number;
    Distance_to_River: number;
    Aspect: number;
}

export interface FloodPredictionResponse {
    baseline_rf: ModelPrediction;
    ensemble: ModelPrediction;
    extracted_values: ExtractedValues;
}

interface PredictionErrorPayload {
    detail?: string;
    message?: string;
}

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL,
    timeout: 10_000,
    headers: {
        "Content-Type": "application/json",
    },
});

export async function predictFloodRisk(
    lat: number,
    lng: number,
): Promise<FloodPredictionResponse> {
    try {
        const response = await apiClient.post<FloodPredictionResponse>(
            "/predict",
            {
                lat,
                lng,
            },
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError<PredictionErrorPayload>(error)) {
            if (error.code === "ECONNABORTED") {
                throw new Error(
                    "The prediction request timed out after 10 seconds.",
                );
            }

            const status = error.response?.status;
            const serverMessage =
                error.response?.data?.detail ?? error.response?.data?.message;

            if (status && serverMessage) {
                throw new Error(
                    `Prediction failed (${status}): ${serverMessage}`,
                );
            }

            if (status) {
                throw new Error(
                    `Prediction failed with status code ${status}.`,
                );
            }
        }

        throw new Error(
            "Unable to reach the flood prediction service. Please try again.",
        );
    }
}
