/**
 * Model Comparison Component - Compares baseline RF vs improved Ensemble model
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Zap } from "lucide-react";

interface ModelPrediction {
    prediction: number;
    probability: number;
    risk_level: string;
    risk_color: string;
    label: string;
    override: boolean;
    override_reason: string | null;
}

interface ModelComparisonProps {
    baselineRf: ModelPrediction;
    ensemble: ModelPrediction;
}

export function ModelComparison({
    baselineRf,
    ensemble,
}: ModelComparisonProps) {
    const probDiff =
        Math.abs(ensemble.probability - baselineRf.probability) * 100;
    const agree = ensemble.label === baselineRf.label;

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
                        {agree ? "Models Agree" : "Models Differ"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Model Cards */}
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Baseline RF */}
                    <div className="rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                Baseline Model
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                                Random Forest
                            </Badge>
                        </div>
                        <ModelStats prediction={baselineRf} />
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500">
                                AUC: 0.85 · Single Algorithm
                            </p>
                        </div>
                    </div>

                    {/* Ensemble */}
                    <div className="rounded-lg border-2 border-purple-600 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 p-4 space-y-3 relative overflow-hidden">
                        <div className="absolute top-2 right-2">
                            <Zap className="h-8 w-8 text-purple-600/20" />
                        </div>
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                                Improved Model
                            </h3>
                            <Badge className="bg-purple-600 text-white text-xs">
                                Ensemble (RF + XGBoost)
                            </Badge>
                        </div>
                        <ModelStats prediction={ensemble} accent />
                        <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
                            <p className="text-xs text-slate-700 dark:text-slate-400">
                                AUC: 0.87 · Stacking Ensemble
                            </p>
                        </div>
                    </div>
                </div>

                {/* Probability delta callout */}
                {probDiff > 0.5 && (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        The ensemble and baseline probabilities differ by{" "}
                        <strong>{probDiff.toFixed(1)}%</strong>.{" "}
                        {agree
                            ? "Both models agree on the outcome."
                            : "The models disagree — consider reviewing conditions."}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ModelStats({
    prediction,
    accent = false,
}: {
    prediction: ModelPrediction;
    accent?: boolean;
}) {
    const textCls = accent
        ? "text-purple-900 dark:text-purple-100"
        : "text-slate-900 dark:text-slate-100";
    const mutedCls = accent
        ? "text-slate-700 dark:text-slate-300"
        : "text-slate-600 dark:text-slate-400";

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className={`text-sm ${mutedCls}`}>Risk Level</span>
                <span
                    className="font-semibold text-sm px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: prediction.risk_color }}
                >
                    {prediction.risk_level}
                </span>
            </div>
            <div className="flex justify-between items-center">
                <span className={`text-sm ${mutedCls}`}>Probability</span>
                <span className={`font-semibold ${textCls}`}>
                    {(prediction.probability * 100).toFixed(1)}%
                </span>
            </div>
            <div className="flex justify-between items-center">
                <span className={`text-sm ${mutedCls}`}>Outcome</span>
                <span className={`font-semibold ${textCls}`}>
                    {prediction.label}
                </span>
            </div>
            {prediction.override && prediction.override_reason && (
                <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-1 mt-1">
                    ⚠️ {prediction.override_reason}
                </div>
            )}
        </div>
    );
}
