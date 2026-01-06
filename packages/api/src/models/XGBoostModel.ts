/**
 * XGBoostModel - Implements gradient boosting with error correction
 * Provides precision through sequential error minimization
 */

import { BaseModel, ModelPrediction } from "./BaseModel";
import { GeoFactorData } from "./GeoFactor";

export class XGBoostModel extends BaseModel {
    private numRounds: number;
    private learningRate: number;

    constructor(numRounds: number = 50, learningRate: number = 0.1) {
        super("XGBoost");
        this.numRounds = numRounds;
        this.learningRate = learningRate;
    }

    /**
     * Predict flood susceptibility using XGBoost approach
     * Uses gradient boosting - each round corrects previous errors
     */
    predict(factors: GeoFactorData): ModelPrediction {
        if (!this.trained) {
            throw new Error("Model must be trained before prediction");
        }

        // Start with base prediction
        let prediction = 0.5;
        const roundPredictions: number[] = [prediction];

        // Sequential boosting rounds
        for (let round = 0; round < this.numRounds; round++) {
            const gradient = this.calculateGradient(factors, prediction, round);
            prediction += this.learningRate * gradient;
            prediction = Math.max(0, Math.min(1, prediction)); // Clamp to [0,1]
            roundPredictions.push(prediction);
        }

        // Calculate confidence based on convergence
        const convergenceRate = this.calculateConvergence(roundPredictions);
        const confidence = Math.min(0.95, 0.7 + convergenceRate * 0.25);

        return {
            probability: prediction,
            confidence,
            riskLevel: this.calculateRiskLevel(prediction),
        };
    }

    /**
     * Calculate gradient for boosting iteration
     * Each iteration focuses on correcting previous errors
     */
    private calculateGradient(
        factors: GeoFactorData,
        currentPrediction: number,
        round: number
    ): number {
        // Calculate residual error based on feature importance
        let gradient = 0;

        // Focus on different features in different rounds (error correction)
        const focusOnDistance = round % 4 === 0;
        const focusOnSlope = round % 4 === 1;
        const focusOnRainfall = round % 4 === 2;
        const focusOnLULC = round % 4 === 3;

        // Distance to river - most critical factor
        if (focusOnDistance) {
            const distanceRisk = this.calculateDistanceRisk(
                factors.distanceToRiver
            );
            gradient += (distanceRisk - currentPrediction) * 1.5;
        }

        // Slope gradient
        if (focusOnSlope) {
            const slopeRisk = this.calculateSlopeRisk(factors.slope);
            gradient += (slopeRisk - currentPrediction) * 1.2;
        }

        // Rainfall intensity
        if (focusOnRainfall) {
            const rainfallRisk = this.calculateRainfallRisk(factors.rainfall);
            gradient += (rainfallRisk - currentPrediction) * 1.0;
        }

        // Land use impact
        if (focusOnLULC) {
            const lulcRisk = this.calculateLULCRisk(factors.landUseClass);
            gradient += (lulcRisk - currentPrediction) * 1.1;
        }

        // Always consider combined factors
        const elevationRisk = this.calculateElevationRisk(factors.elevation);
        const curvatureRisk = this.calculateCurvatureRisk(
            factors.profileCurvature
        );

        gradient += (elevationRisk - currentPrediction) * 0.8;
        gradient += (curvatureRisk - currentPrediction) * 0.7;

        return gradient;
    }

    /**
     * Risk calculation for distance to river
     */
    private calculateDistanceRisk(distance: number): number {
        if (distance < 50) return 0.95;
        if (distance < 100) return 0.85;
        if (distance < 200) return 0.7;
        if (distance < 500) return 0.5;
        if (distance < 1000) return 0.3;
        return 0.15;
    }

    /**
     * Risk calculation for slope
     */
    private calculateSlopeRisk(slope: number): number {
        if (slope < 2) return 0.9; // Flat areas accumulate water
        if (slope < 5) return 0.75;
        if (slope < 10) return 0.55;
        if (slope < 20) return 0.35;
        if (slope < 35) return 0.2;
        return 0.1; // Steep slopes drain quickly
    }

    /**
     * Risk calculation for rainfall
     */
    private calculateRainfallRisk(rainfall: number): number {
        if (rainfall > 2400) return 0.85;
        if (rainfall > 2200) return 0.7;
        if (rainfall > 2000) return 0.6;
        if (rainfall > 1800) return 0.5;
        return 0.4;
    }

    /**
     * Risk calculation for land use
     */
    private calculateLULCRisk(landUse: string): number {
        switch (landUse) {
            case "Urban Built-Up":
                return 0.8; // High runoff
            case "Agricultural Land":
                return 0.6; // Moderate risk
            case "Mixed Vegetation":
                return 0.4;
            case "Forest":
                return 0.25; // Natural water retention
            default:
                return 0.5;
        }
    }

    /**
     * Risk calculation for elevation
     */
    private calculateElevationRisk(elevation: number): number {
        if (elevation < 20) return 0.85;
        if (elevation < 50) return 0.7;
        if (elevation < 100) return 0.55;
        if (elevation < 200) return 0.4;
        return 0.25;
    }

    /**
     * Risk calculation for profile curvature
     */
    private calculateCurvatureRisk(curvature: number): number {
        if (curvature < -3) return 0.8; // Highly concave
        if (curvature < -1) return 0.65;
        if (curvature < 0) return 0.55;
        if (curvature < 2) return 0.45;
        return 0.35; // Convex areas
    }

    /**
     * Calculate convergence rate of predictions
     */
    private calculateConvergence(predictions: number[]): number {
        if (predictions.length < 2) return 0;

        let totalChange = 0;
        for (let i = 1; i < predictions.length; i++) {
            totalChange += Math.abs(predictions[i] - predictions[i - 1]);
        }

        const avgChange = totalChange / (predictions.length - 1);
        return 1 - Math.min(1, avgChange * 5); // Lower change = higher convergence
    }
}
