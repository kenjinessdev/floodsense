/**
 * BaseModel - Parent class for machine learning models
 * Implements the foundation for Random Forest and XGBoost models
 */

import { GeoFactorData } from "./GeoFactor";

export interface ModelPrediction {
    probability: number; // 0-1 probability of flood susceptibility
    confidence: number; // Model confidence score
    riskLevel: "Low" | "Moderate" | "High" | "Very High";
}

export interface TrainingPoint {
    factors: GeoFactorData;
    flooded: boolean;
}

export abstract class BaseModel {
    protected modelName: string;
    protected trained: boolean = false;
    protected trainingData: TrainingPoint[] = [];

    constructor(modelName: string) {
        this.modelName = modelName;
    }

    /**
     * Train the model with flooded and unflooded points
     * In prototype, we use synthetic training data based on Davao City patterns
     */
    train(trainingData: TrainingPoint[]): void {
        this.trainingData = trainingData;
        this.trained = true;
        console.log(
            `${this.modelName} trained with ${trainingData.length} points`
        );
    }

    /**
     * Abstract method - must be implemented by subclasses
     */
    abstract predict(factors: GeoFactorData): ModelPrediction;

    /**
     * Convert probability to risk level
     */
    protected calculateRiskLevel(
        probability: number
    ): "Low" | "Moderate" | "High" | "Very High" {
        if (probability < 0.25) return "Low";
        if (probability < 0.5) return "Moderate";
        if (probability < 0.75) return "High";
        return "Very High";
    }

    /**
     * Calculate feature importance score for a single factor
     */
    protected calculateFactorScore(
        value: number,
        range: [number, number],
        higherIsBetter: boolean = false
    ): number {
        const normalized = (value - range[0]) / (range[1] - range[0]);
        return higherIsBetter ? normalized : 1 - normalized;
    }

    getName(): string {
        return this.modelName;
    }

    isTrained(): boolean {
        return this.trained;
    }
}
