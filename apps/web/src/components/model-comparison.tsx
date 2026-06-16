/**
 * Model Comparison Component - Compares all models in the prediction pipeline
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Zap, AlertTriangle, GitMerge } from "lucide-react";
import { riskColorFromProbability } from "@/lib/risk-color";

interface ModelPrediction {
    prediction: number;
    probability: number;
    risk_level: string;
    label: string;
    override: boolean;
    override_reason: string | null;
}

interface ModelComparisonProps {
    baselineRf: ModelPrediction;
    rfInsideEnsemble?: ModelPrediction;
    xgbInsideEnsemble?: ModelPrediction;
    ensemble: ModelPrediction;
}

export function ModelComparison({
    baselineRf,
    rfInsideEnsemble,
    xgbInsideEnsemble,
    ensemble,
}: ModelComparisonProps) {
    const probDiff =
        Math.abs(ensemble.probability - baselineRf.probability) * 100;
    const agree = ensemble.label === baselineRf.label;
    const showEnsembleBreakdown = rfInsideEnsemble || xgbInsideEnsemble;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Target aria-hidden="true" className="h-5 w-5 text-primary" />
                        Model Performance Comparison
                    </CardTitle>
                    <Badge variant="secondary">
                        {agree ? "Models Agree" : "Models Differ"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Row 1 — Standalone models + final ensemble */}
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

                    {/* Final Ensemble */}
                    <div className="rounded-lg border-2 border-primary bg-accent/30 p-4 space-y-3 relative overflow-hidden shadow-md">
                        <div className="absolute top-2 right-2">
                            <Zap aria-hidden="true" className="h-8 w-8 text-primary/20" />
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

                {/* Row 2 — Inside-ensemble breakdown */}
                {showEnsembleBreakdown && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <GitMerge aria-hidden="true" className="h-4 w-4" />
                            <span className="font-medium">Inside the Ensemble</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {rfInsideEnsemble && (
                                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-foreground">
                                            RF in Ensemble
                                        </h3>
                                        <Badge variant="outline" className="text-xs">
                                            Random Forest
                                        </Badge>
                                    </div>
                                    <ModelStats prediction={rfInsideEnsemble} />
                                    <div className="pt-2 border-t border-border">
                                        <p className="text-xs text-muted-foreground">
                                            Base learner · stacked output
                                        </p>
                                    </div>
                                </div>
                            )}
                            {xgbInsideEnsemble && (
                                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-foreground">
                                            XGBoost in Ensemble
                                        </h3>
                                        <Badge variant="outline" className="text-xs">
                                            XGBoost
                                        </Badge>
                                    </div>
                                    <ModelStats prediction={xgbInsideEnsemble} />
                                    <div className="pt-2 border-t border-border">
                                        <p className="text-xs text-muted-foreground">
                                            Base learner · stacked output
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
    const textCls = accent ? "text-accent-foreground" : "text-foreground";
    const mutedCls = "text-muted-foreground";

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className={`text-sm ${mutedCls}`}>Susceptibility Level</span>
                <span
                    className={`font-semibold text-sm px-2 py-0.5 rounded-full text-white ${riskColorFromProbability(prediction.probability)}`}
                >
                    {prediction.risk_level}
                </span>
            </div>
            <div className="flex justify-between items-center">
                <span className={`text-sm ${mutedCls}`}>Probability</span>
                <span className={`text-2xl font-bold ${textCls}`}>
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
