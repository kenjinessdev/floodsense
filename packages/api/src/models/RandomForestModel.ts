/**
 * RandomForestModel - Implements bagging technique with majority voting
 * Provides stability through ensemble of decision trees
 */

import { BaseModel, ModelPrediction } from "./BaseModel";
import { GeoFactorData } from "./GeoFactor";

export class RandomForestModel extends BaseModel {
    private numTrees: number;

    constructor(numTrees: number = 100) {
        super("Random Forest");
        this.numTrees = numTrees;
    }

    /**
     * Predict flood susceptibility using Random Forest approach
     * Uses bagging (Bootstrap Aggregating) and majority voting
     */
    predict(factors: GeoFactorData): ModelPrediction {
        if (!this.trained) {
            throw new Error("Model must be trained before prediction");
        }

        // Simulate multiple decision trees voting
        const treeVotes: number[] = [];

        for (let i = 0; i < this.numTrees; i++) {
            const vote = this.singleTreePredict(factors, i);
            treeVotes.push(vote);
        }

        // Majority voting - average of all tree predictions
        const probability =
            treeVotes.reduce((sum, vote) => sum + vote, 0) / this.numTrees;

        // Calculate confidence based on vote consistency
        const voteVariance = this.calculateVariance(treeVotes);
        const confidence = Math.max(0.5, 1 - voteVariance);

        return {
            probability,
            confidence,
            riskLevel: this.calculateRiskLevel(probability),
        };
    }

    /**
     * Simulate a single decision tree prediction
     * Each tree uses a random subset of features (bagging)
     */
    private singleTreePredict(
        factors: GeoFactorData,
        treeIndex: number
    ): number {
        // Pseudo-random feature selection based on tree index
        const useSlope = treeIndex % 3 !== 0;
        const useDistance = treeIndex % 5 !== 0;
        const useRainfall = treeIndex % 7 !== 0;
        const useLULC = treeIndex % 2 === 0;

        let score = 0;
        let weight = 0;

        // Distance to river (most important factor in study)
        if (useDistance) {
            if (factors.distanceToRiver < 50) score += 0.9;
            else if (factors.distanceToRiver < 200) score += 0.6;
            else if (factors.distanceToRiver < 500) score += 0.4;
            else score += 0.2;
            weight += 1.5; // Higher weight for critical factor
        }

        // Slope (low slope = higher flood risk)
        if (useSlope) {
            if (factors.slope < 5) score += 0.8;
            else if (factors.slope < 15) score += 0.5;
            else if (factors.slope < 30) score += 0.3;
            else score += 0.1;
            weight += 1.2;
        }

        // Rainfall
        if (useRainfall) {
            if (factors.rainfall > 2200) score += 0.7;
            else if (factors.rainfall > 1900) score += 0.5;
            else score += 0.3;
            weight += 1.0;
        }

        // Land Use (Urban built-up increases risk due to runoff)
        if (useLULC) {
            if (factors.landUseClass === "Urban Built-Up") score += 0.7;
            else if (factors.landUseClass === "Agricultural Land") score += 0.5;
            else score += 0.3;
            weight += 1.0;
        }

        // Profile curvature (negative = concave = accumulation)
        if (factors.profileCurvature < -2) score += 0.6;
        else if (factors.profileCurvature < 0) score += 0.4;
        weight += 0.8;

        // Elevation (lower elevation = higher risk)
        if (factors.elevation < 50) score += 0.7;
        else if (factors.elevation < 150) score += 0.4;
        weight += 0.8;

        return weight > 0 ? score / weight : 0.5;
    }

    /**
     * Calculate variance of tree votes for confidence metric
     */
    private calculateVariance(values: number[]): number {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    }
}
