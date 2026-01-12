/**
 * Flood Analysis Router - tRPC API endpoints for flood risk assessment
 */

import { z } from "zod";
import { publicProcedure, router } from "../index";
import { GeoFactor, Location } from "../models/GeoFactor";
import { EnsemblePredictor } from "../models/EnsemblePredictor";

// Create singleton instance of the ensemble predictor
const ensemblePredictor = new EnsemblePredictor();

// Davao City mainland boundary polygon (approximate, excluding Samal)
const DAVAO_MAINLAND_POLYGON: Array<[number, number]> = [
    [6.96, 125.36],
    [6.95, 125.45],
    [6.97, 125.52],
    [6.98, 125.58],
    [6.99, 125.63],
    [7.02, 125.65],
    [7.08, 125.66],
    [7.12, 125.67],
    [7.18, 125.66],
    [7.22, 125.64],
    [7.25, 125.6],
    [7.25, 125.56],
    [7.23, 125.52],
    [7.21, 125.49],
    [7.18, 125.46],
    [7.14, 125.44],
    [7.1, 125.42],
    [7.06, 125.4],
    [7.02, 125.38],
    [6.98, 125.37],
    [6.96, 125.36],
];

function isPointInPolygon(
    lat: number,
    lng: number,
    poly: Array<[number, number]>
) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][1],
            yi = poly[i][0];
        const xj = poly[j][1],
            yj = poly[j][0];
        const intersect =
            yi > lat !== yj > lat &&
            lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

export const floodRouter = router({
    /**
     * Analyze flood risk for a given location
     */
    analyzeLocation: publicProcedure
        .input(
            z.object({
                latitude: z
                    .number()
                    .min(6.95)
                    .max(7.25)
                    .describe("Latitude (Davao City mainland bounds)"),
                longitude: z
                    .number()
                    .min(125.35)
                    .max(125.67)
                    .describe("Longitude (Davao City mainland bounds)"),
            })
        )
        .mutation(async ({ input }) => {
            // Guard: ensure location is within Davao mainland polygon
            if (
                !isPointInPolygon(
                    input.latitude,
                    input.longitude,
                    DAVAO_MAINLAND_POLYGON
                )
            ) {
                throw new Error(
                    "Location is outside Davao City mainland bounds (lat 6.95–7.25, lng 125.35–125.67)"
                );
            }
            const location: Location = {
                latitude: input.latitude,
                longitude: input.longitude,
            };

            // Extract geo factors
            const geoFactor = new GeoFactor(location);
            const factors = await geoFactor.extractFactors();

            // Get ensemble prediction
            const prediction = ensemblePredictor.predict(factors);

            // Get factor importance analysis
            const factorImportance = ensemblePredictor.analyzeFactors(factors);

            return {
                location,
                factors,
                prediction,
                factorImportance,
                timestamp: new Date().toISOString(),
            };
        }),

    /**
     * Get factor details for a specific location (for layer viewing)
     */
    getFactorDetails: publicProcedure
        .input(
            z.object({
                latitude: z.number(),
                longitude: z.number(),
                factor: z.enum([
                    "elevation",
                    "slope",
                    "aspect",
                    "profileCurvature",
                    "distanceToRiver",
                    "rainfall",
                    "landUseClass",
                    "lithology",
                ]),
            })
        )
        .query(async ({ input }) => {
            const location: Location = {
                latitude: input.latitude,
                longitude: input.longitude,
            };

            const geoFactor = new GeoFactor(location);
            const factors = await geoFactor.extractFactors();

            return {
                location,
                factor: input.factor,
                value: factors[input.factor],
                timestamp: new Date().toISOString(),
            };
        }),

    /**
     * Get model information and training status
     */
    getModelInfo: publicProcedure.query(() => {
        return {
            modelType: "Ensemble (Random Forest + XGBoost)",
            algorithm: "Stacking",
            trained: ensemblePredictor.isTrained(),
            accuracy: {
                randomForest: 0.85,
                xgboost: 0.86,
                ensemble: 0.87,
            },
            studyReference: "Davao City Flood Susceptibility Mapping",
            factorsUsed: 8,
            trainingArea: "Davao City, Mindanao, Philippines",
        };
    }),

    /**
     * Validate if a location is within Davao City bounds
     */
    validateLocation: publicProcedure
        .input(
            z.object({
                latitude: z.number(),
                longitude: z.number(),
            })
        )
        .query(({ input }) => {
            const isInDavaoCity = isPointInPolygon(
                input.latitude,
                input.longitude,
                DAVAO_MAINLAND_POLYGON
            );

            return {
                valid: isInDavaoCity,
                location: input,
                message: isInDavaoCity
                    ? "Location is within Davao City mainland bounds (lat 6.95–7.25, lng 125.35–125.67)"
                    : "Location is outside Davao City. Analysis limited to Davao City area.",
            };
        }),

    /**
     * Get known flood-prone areas in Davao City
     */
    getFloodProneAreas: publicProcedure.query(() => {
        return {
            areas: [
                {
                    name: "Matina Pangi",
                    latitude: 7.06,
                    longitude: 125.61,
                    description:
                        "Known flood-prone area with urban development",
                    riskLevel: "Very High",
                },
                {
                    name: "Talomo",
                    latitude: 7.05,
                    longitude: 125.59,
                    description: "Low-lying area near Talomo River",
                    riskLevel: "High",
                },
                {
                    name: "Buhangin",
                    latitude: 7.08,
                    longitude: 125.62,
                    description: "Flood-prone coastal area",
                    riskLevel: "High",
                },
                {
                    name: "Davao River Basin",
                    latitude: 7.07,
                    longitude: 125.61,
                    description: "Areas along Davao River",
                    riskLevel: "High",
                },
            ],
        };
    }),
});
