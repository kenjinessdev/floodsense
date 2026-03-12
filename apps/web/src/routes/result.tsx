import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskGauge } from "@/components/risk-gauge";
import { FactorAnalysis } from "@/components/factor-analysis";
import { ModelComparison } from "@/components/model-comparison";
import { trpc } from "@/utils/trpc";
import { ArrowLeft, Download, AlertCircle } from "lucide-react";

const searchSchema = z.object({
    lat: z.number().finite().min(6.8).max(7.6),
    lng: z.number().finite().min(125.2).max(125.8),
});

export const Route = createFileRoute("/result")({
    component: ResultComponent,
    validateSearch: searchSchema.parse,
});

function ResultComponent() {
    const navigate = useNavigate();
    const { lat, lng } = Route.useSearch();

    const { data, isLoading, isError, error, refetch } =
        trpc.flood.predict.useQuery(
            { latitude: lat, longitude: lng },
            { retry: 1, staleTime: 5 * 60 * 1000 },
        );

    const errorMessage = (() => {
        if (!error) return "An unexpected error occurred.";
        if (error.data?.code === "BAD_REQUEST")
            return "The selected coordinates are outside the supported Davao City region (lat 6.8–7.6, lng 125.2–125.8).";
        if (
            error.message.includes("unavailable") ||
            error.data?.code === "INTERNAL_SERVER_ERROR"
        )
            return "The prediction service is currently unavailable. Please try again later.";
        return error.message;
    })();

    const handleBack = () => navigate({ to: "/" });

    const handleDownload = () => {
        if (!data) return;
        const report = {
            title: "Davao FloodSense Risk Assessment Report",
            coordinates: data.coordinates,
            extracted_values: data.extracted_values,
            baseline_rf: data.baseline_rf,
            ensemble: data.ensemble,
            generated_at: new Date().toISOString(),
            disclaimer:
                "This is a susceptibility assessment based on offline data, not real-time forecasting.",
        };
        const blob = new Blob([JSON.stringify(report, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `flood-risk-${lat.toFixed(4)}_${lng.toFixed(4)}.json`;
        a.click();
        URL.revokeObjectURL(url);
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
                {isError && (
                    <Card className="mb-6 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
                        <CardContent className="pt-6 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-800 dark:text-red-300">
                                    Failed to load prediction
                                </p>
                                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                    {errorMessage}
                                </p>
                                <Button
                                    onClick={() => refetch()}
                                    variant="outline"
                                    size="sm"
                                    className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                                >
                                    Retry
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

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
                                {isLoading || !data ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-32 w-full rounded-lg" />
                                        <Skeleton className="h-8 w-3/4 mx-auto rounded-full" />
                                        <Skeleton className="h-4 w-full rounded" />
                                    </div>
                                ) : (
                                    <>
                                        <RiskGauge
                                            probability={
                                                data.ensemble.probability
                                            }
                                            riskLevel={data.ensemble.risk_level}
                                            riskColor={data.ensemble.risk_color}
                                            label={data.ensemble.label}
                                            override={data.ensemble.override}
                                            overrideReason={
                                                data.ensemble.override_reason
                                            }
                                        />
                                        <div className="mt-6 space-y-2">
                                            <Button
                                                onClick={handleDownload}
                                                variant="outline"
                                                className="w-full border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900"
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Download Report
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {isLoading || !data ? (
                            <>
                                <Skeleton className="h-64 w-full rounded-xl" />
                                <Skeleton className="h-80 w-full rounded-xl" />
                            </>
                        ) : (
                            <>
                                <ModelComparison
                                    baselineRf={data.baseline_rf}
                                    ensemble={data.ensemble}
                                />

                                <FactorAnalysis
                                    extractedValues={data.extracted_values}
                                />

                                <Recommendations
                                    riskLevel={data.ensemble.risk_level}
                                />

                                <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
                                            🔬 Methodology
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                                        <p>
                                            <strong>Ensemble Model:</strong>{" "}
                                            Combines Random Forest and XGBoost
                                            via stacking for higher accuracy
                                            (AUC 0.87+).
                                        </p>
                                        <p>
                                            <strong>Random Forest:</strong>{" "}
                                            Stability through bagging and
                                            majority voting from 100 decision
                                            trees.
                                        </p>
                                        <p>
                                            <strong>XGBoost:</strong> Precision
                                            through gradient boosting with
                                            sequential error correction.
                                        </p>
                                        <p>
                                            <strong>Training Data:</strong>{" "}
                                            Flooded and unflooded points from
                                            Davao City using 8 key conditioning
                                            factors.
                                        </p>
                                        <p className="text-xs text-gray-500 mt-4">
                                            Assessment generated at:{" "}
                                            {new Date().toLocaleString()}
                                        </p>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Recommendations({ riskLevel }: { riskLevel: string }) {
    const isHighRisk = riskLevel === "Very High" || riskLevel === "High";
    const isModerate = riskLevel === "Moderate";

    return (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader>
                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
                    💡 Recommendations
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                    {isHighRisk ? (
                        <>
                            <RecommendationItem icon="⚠️" color="text-red-600">
                                High flood susceptibility detected. Consider
                                flood mitigation measures if planning
                                construction or development.
                            </RecommendationItem>
                            <RecommendationItem
                                icon="🏗️"
                                color="text-orange-600"
                            >
                                Implement elevated foundations, proper drainage
                                systems, and flood-resistant building materials.
                            </RecommendationItem>
                            <RecommendationItem icon="🚨" color="text-blue-600">
                                Stay informed about weather conditions and have
                                an emergency evacuation plan during monsoon
                                season.
                            </RecommendationItem>
                        </>
                    ) : isModerate ? (
                        <>
                            <RecommendationItem
                                icon="⚡"
                                color="text-yellow-600"
                            >
                                Moderate risk detected. Consider preventive
                                measures such as improved drainage systems.
                            </RecommendationItem>
                            <RecommendationItem
                                icon="✅"
                                color="text-green-600"
                            >
                                Monitor local weather patterns and maintain
                                awareness during heavy rainfall events.
                            </RecommendationItem>
                        </>
                    ) : (
                        <>
                            <RecommendationItem
                                icon="✅"
                                color="text-green-600"
                            >
                                Low flood risk detected. This location appears
                                relatively safe based on terrain and
                                environmental factors.
                            </RecommendationItem>
                            <RecommendationItem icon="ℹ️" color="text-blue-600">
                                Continue to maintain awareness of extreme
                                weather events and local conditions.
                            </RecommendationItem>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function RecommendationItem({
    icon,
    color,
    children,
}: {
    icon: string;
    color: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex gap-2">
            <span className={`font-semibold ${color}`}>{icon}</span>
            <p>{children}</p>
        </div>
    );
}
