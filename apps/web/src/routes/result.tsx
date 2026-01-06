import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskGauge } from "@/components/risk-gauge";
import { FactorAnalysis } from "@/components/factor-analysis";
import { ArrowLeft, Download, Share2 } from "lucide-react";

export const Route = createFileRoute("/result")({
    component: ResultComponent,
    validateSearch: (search: Record<string, unknown>) => {
        return {
            lat: Number(search.lat),
            lng: Number(search.lng),
            data: search.data as string,
        };
    },
});

function ResultComponent() {
    const navigate = useNavigate();
    const { lat, lng, data } = Route.useSearch();

    const result = JSON.parse(data);
    const { factors, prediction, factorImportance, timestamp } = result;

    const handleBack = () => {
        navigate({ to: "/" });
    };

    const handleDownload = () => {
        const report = {
            title: "Davao FloodSense Risk Assessment Report",
            location: { latitude: lat, longitude: lng },
            assessment: {
                riskLevel: prediction.riskLevel,
                probability: prediction.probability,
                confidence: prediction.confidence,
            },
            factors,
            keyRiskFactors: factorImportance,
            timestamp,
            disclaimer:
                "This is a susceptibility assessment based on offline data, not real-time forecasting.",
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `flood-risk-assessment-${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleShare = async () => {
        const shareText = `Flood Risk Assessment for location ${lat.toFixed(
            4
        )}, ${lng.toFixed(4)}: ${prediction.riskLevel} Risk (${Math.round(
            prediction.probability * 100
        )}% susceptibility)`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Davao FloodSense Assessment",
                    text: shareText,
                });
            } catch (error) {
                console.log("Share cancelled or failed", error);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText);
            alert("Assessment summary copied to clipboard!");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            {/* Header */}
            <header className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                🌊 Flood Risk Assessment
                            </h1>
                            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-1">
                                Location: {lat.toFixed(6)}, {lng.toFixed(6)}
                            </p>
                        </div>
                        <Button
                            onClick={handleBack}
                            variant="outline"
                            className="border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Map
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Risk Gauge */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-4 border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="text-slate-900 dark:text-slate-100">
                                    Flood Susceptibility
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RiskGauge
                                    probability={prediction.probability}
                                    riskLevel={prediction.riskLevel}
                                    confidence={prediction.confidence}
                                />

                                {/* Model Details */}
                                <div className="mt-6 pt-6 border-t space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Random Forest:
                                        </span>
                                        <span className="font-medium">
                                            {Math.round(
                                                prediction.rfProbability * 100
                                            )}
                                            %
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            XGBoost:
                                        </span>
                                        <span className="font-medium">
                                            {Math.round(
                                                prediction.xgbProbability * 100
                                            )}
                                            %
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                        <span className="text-gray-600">
                                            Ensemble:
                                        </span>
                                        <span className="font-semibold">
                                            {Math.round(
                                                prediction.probability * 100
                                            )}
                                            %
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-6 space-y-2">
                                    <Button
                                        onClick={handleDownload}
                                        variant="outline"
                                        className="w-full border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900"
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Report
                                    </Button>
                                    <Button
                                        onClick={handleShare}
                                        variant="outline"
                                        className="w-full border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900"
                                    >
                                        <Share2 className="mr-2 h-4 w-4" />
                                        Share Results
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Factor Analysis */}
                    <div className="lg:col-span-2">
                        <FactorAnalysis
                            factors={factors}
                            importanceList={factorImportance}
                        />

                        {/* Recommendations */}
                        <Card className="mt-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
                                    💡 Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                                    {prediction.riskLevel === "Very High" ||
                                    prediction.riskLevel === "High" ? (
                                        <>
                                            <div className="flex gap-2">
                                                <span className="font-semibold text-red-600">
                                                    ⚠️
                                                </span>
                                                <p>
                                                    This location has high flood
                                                    susceptibility. Consider
                                                    flood mitigation measures if
                                                    planning construction or
                                                    development.
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="font-semibold text-orange-600">
                                                    🏗️
                                                </span>
                                                <p>
                                                    If building in this area,
                                                    implement elevated
                                                    foundations, proper drainage
                                                    systems, and flood-resistant
                                                    materials.
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="font-semibold text-blue-600">
                                                    🚨
                                                </span>
                                                <p>
                                                    Stay informed about weather
                                                    conditions and have an
                                                    emergency evacuation plan,
                                                    especially during monsoon
                                                    season.
                                                </p>
                                            </div>
                                        </>
                                    ) : prediction.riskLevel === "Moderate" ? (
                                        <>
                                            <div className="flex gap-2">
                                                <span className="font-semibold text-yellow-600">
                                                    ⚡
                                                </span>
                                                <p>
                                                    Moderate risk detected.
                                                    While not in immediate
                                                    danger, consider preventive
                                                    measures such as improved
                                                    drainage.
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="font-semibold text-green-600">
                                                    ✅
                                                </span>
                                                <p>
                                                    Monitor local weather
                                                    patterns and maintain
                                                    awareness during heavy
                                                    rainfall events.
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex gap-2">
                                                <span className="font-semibold text-green-600">
                                                    ✅
                                                </span>
                                                <p>
                                                    Low flood risk detected.
                                                    This location appears
                                                    relatively safe from
                                                    flooding based on terrain
                                                    and environmental factors.
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="font-semibold text-blue-600">
                                                    ℹ️
                                                </span>
                                                <p>
                                                    Continue to maintain
                                                    awareness of extreme weather
                                                    events and local conditions.
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Methodology */}
                        <Card className="mt-6 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
                            <CardHeader>
                                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
                                    🔬 Methodology
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                                <p>
                                    <strong>Ensemble Model:</strong> This
                                    assessment combines Random Forest and
                                    XGBoost algorithms using a stacking approach
                                    to achieve higher accuracy (AUC 0.87+).
                                </p>
                                <p>
                                    <strong>Random Forest:</strong> Provides
                                    stability through bagging (bootstrap
                                    aggregating) and majority voting from 100
                                    decision trees.
                                </p>
                                <p>
                                    <strong>XGBoost:</strong> Adds precision
                                    through gradient boosting with sequential
                                    error correction over 50 rounds.
                                </p>
                                <p>
                                    <strong>Training Data:</strong> Model
                                    trained on flooded and unflooded points from
                                    Davao City, incorporating 8 key conditioning
                                    factors.
                                </p>
                                <p className="text-xs text-gray-500 mt-4">
                                    Assessment generated at:{" "}
                                    {new Date(timestamp).toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
