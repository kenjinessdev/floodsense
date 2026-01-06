/**
 * Flood Analysis Router - tRPC API endpoints for flood risk assessment
 */

import { z } from "zod";
import { publicProcedure, router } from "../index";
import { GeoFactor, Location } from "../models/GeoFactor";
import { EnsemblePredictor } from "../models/EnsemblePredictor";

// Create singleton instance of the ensemble predictor
const ensemblePredictor = new EnsemblePredictor();

export const floodRouter = router({
    /**
     * Analyze flood risk for a given location
     */
    analyzeLocation: publicProcedure
        .input(
            z.object({
                latitude: z
                    .number()
                    .min(6.9)
                    .max(7.3)
                    .describe("Latitude (Davao City bounds)"),
                longitude: z
                    .number()
                    .min(125.3)
                    .max(125.8)
                    .describe("Longitude (Davao City bounds)"),
            })
        )
        .mutation(async ({ input }) => {
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
            const isInDavaoCity =
                input.latitude >= 6.9 &&
                input.latitude <= 7.3 &&
                input.longitude >= 125.3 &&
                input.longitude <= 125.8;

            return {
                valid: isInDavaoCity,
                location: input,
                message: isInDavaoCity
                    ? "Location is within Davao City bounds"
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
