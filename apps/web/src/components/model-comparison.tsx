/**
 * Model Comparison Component - Compares baseline RF vs improved Ensemble model
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Zap, AlertTriangle } from "lucide-react";

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
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Model Performance Comparison
                    </CardTitle>
                    <Badge variant="secondary">
                        {agree ? "Models Agree" : "Models Differ"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Model Cards */}
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Baseline RF */}
                    <div className="rounded-lg border-2 border-border bg-card p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">
                                Baseline Model
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                                Random Forest
                            </Badge>
                        </div>
                        <ModelStats prediction={baselineRf} />
                        <div className="pt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                                AUC: 0.85 · Single Algorithm
                            </p>
                        </div>
                    </div>

                    {/* Ensemble */}
                    <div className="rounded-lg border-2 border-primary bg-accent/30 p-4 space-y-3 relative overflow-hidden">
                        <div className="absolute top-2 right-2">
                            <Zap className="h-8 w-8 text-primary/20" />
                        </div>
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-accent-foreground">
                                Improved Model
                            </h3>
                            <Badge className="bg-primary text-primary-foreground text-xs">
                                Ensemble (RF + XGBoost)
                            </Badge>
                        </div>
                        <ModelStats prediction={ensemble} accent />
                        <div className="pt-2 border-t border-primary/20">
                            <p className="text-xs text-muted-foreground">
                                AUC: 0.87 · Stacking Ensemble
                            </p>
                        </div>
                    </div>
                </div>

                {/* Probability delta callout */}
                {probDiff > 0.5 && (
                    <div className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
                        The ensemble and baseline probabilities differ by{" "}
                        <strong>{probDiff.toFixed(1)}%</strong>.{" "}
                        {agree
                            ? "Both models agree on the outcome."
                            : "The models disagree, consider reviewing conditions."}
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
        ? "text-accent-foreground"
        : "text-foreground";
    const mutedCls = accent
        ? "text-muted-foreground"
        : "text-muted-foreground";

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
                    <AlertTriangle className="h-3 w-3 inline mr-1" />{prediction.override_reason}
                </div>
            )}
        </div>
    );
}
