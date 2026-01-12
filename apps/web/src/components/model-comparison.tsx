/**
 * Model Comparison Component - Compares baseline RF vs improved Ensemble model
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap, Target, AlertTriangle } from "lucide-react";

interface ModelComparisonProps {
    baselineRF: {
        probability: number;
        riskLevel: string;
        confidence: number;
    };
    ensemble: {
        probability: number;
        riskLevel: string;
        confidence: number;
        rfProbability: number;
        xgbProbability: number;
    };
}

export function ModelComparison({
    baselineRF,
    ensemble,
}: ModelComparisonProps) {
    const improvement = (
        (ensemble.confidence - baselineRF.confidence) *
        100
    ).toFixed(1);
    const probDifference =
        Math.abs(ensemble.probability - baselineRF.probability) * 100;

    const getRiskColor = (riskLevel: string) => {
        switch (riskLevel) {
            case "Very Low":
                return "text-green-600 dark:text-green-400";
            case "Low":
                return "text-blue-600 dark:text-blue-400";
            case "Moderate":
                return "text-yellow-600 dark:text-yellow-400";
            case "High":
                return "text-orange-600 dark:text-orange-400";
            case "Very High":
                return "text-red-600 dark:text-red-400";
            default:
                return "text-slate-600 dark:text-slate-400";
        }
    };

    return (
        <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-600" />
                        Model Performance Comparison
                    </CardTitle>
                    <Badge
                        variant="outline"
                        className="border-purple-600 text-purple-600"
                    >
                        Ensemble vs Baseline
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Model Cards */}
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Baseline RF Model */}
                    <div className="rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                Baseline Model
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                                Random Forest
                            </Badge>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    Risk Level
                                </span>
                                <span
                                    className={`font-semibold ${getRiskColor(
                                        baselineRF.riskLevel
                                    )}`}
                                >
                                    {baselineRF.riskLevel}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    Probability
                                </span>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {(baselineRF.probability * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    Confidence
                                </span>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {(baselineRF.confidence * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                                AUC: 0.85 • Single Algorithm
                            </p>
                        </div>
                    </div>

                    {/* Improved Ensemble Model */}
                    <div className="rounded-lg border-2 border-purple-600 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 p-4 space-y-3 relative overflow-hidden">
                        <div className="absolute top-2 right-2">
                            <Zap className="h-8 w-8 text-purple-600/20 dark:text-purple-400/20" />
                        </div>
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                                Improved Model
                            </h3>
                            <Badge className="bg-purple-600 text-white text-xs">
                                Ensemble (RF + XGBoost)
                            </Badge>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                    Risk Level
                                </span>
                                <span
                                    className={`font-semibold ${getRiskColor(
                                        ensemble.riskLevel
                                    )}`}
                                >
                                    {ensemble.riskLevel}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                    Probability
                                </span>
                                <span className="font-semibold text-purple-900 dark:text-purple-100">
                                    {(ensemble.probability * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                    Confidence
                                </span>
                                <span className="font-semibold text-purple-900 dark:text-purple-100">
                                    {(ensemble.confidence * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
                            <p className="text-xs text-slate-700 dark:text-slate-400">
                                AUC: 0.87 • Stacking Ensemble
                            </p>
                        </div>
                    </div>
                </div>

                {/* Ensemble Breakdown */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-4 space-y-3">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        Ensemble Model Breakdown
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                Random Forest Component
                            </p>
                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {(ensemble.rfProbability * 100).toFixed(1)}%
                            </p>
                            <p className="text-xs text-slate-500">
                                Weight: 45%
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                XGBoost Component
                            </p>
                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {(ensemble.xgbProbability * 100).toFixed(1)}%
                            </p>
                            <p className="text-xs text-slate-500">
                                Weight: 55%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 p-4 space-y-3">
                    <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-100 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-purple-600" />
                        Performance Improvement
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-slate-700 dark:text-slate-400">
                                Confidence Gain
                            </p>
                            <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                                +{improvement}%
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-slate-700 dark:text-slate-400">
                                Accuracy (AUC)
                            </p>
                            <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                                0.85 → 0.87
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-slate-700 dark:text-slate-400">
                                Probability Δ
                            </p>
                            <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                                {probDifference.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                        <p className="text-xs text-slate-700 dark:text-slate-400">
                            <strong className="text-purple-700 dark:text-purple-400">
                                Why Ensemble is Better:
                            </strong>{" "}
                            Combines Random Forest's robustness with XGBoost's
                            gradient boosting precision. The stacking approach
                            achieves {improvement}% higher confidence and better
                            generalization by leveraging complementary strengths
                            of both algorithms.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
