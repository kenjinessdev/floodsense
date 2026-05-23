import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskGauge } from "@/components/risk-gauge";
import { RegionalContext } from "@/components/factor-analysis";
import { Interpretation } from "@/components/interpretation";
import { ModelComparison } from "@/components/model-comparison";
import { predictFloodRisk } from "@/lib/api";
import { ArrowLeft, Download, AlertCircle, AlertTriangle, HardHat, Bell, Zap, CheckCircle2, Info } from "lucide-react";

const coordinateSchema = z
    .union([z.number(), z.string()])
    .transform((value) =>
        typeof value === "string" ? parseFloat(value) : value,
    );

const searchSchema = z.object({
    lat: coordinateSchema.pipe(z.number().finite().min(6.8).max(7.6)),
    lng: coordinateSchema.pipe(z.number().finite().min(125.2).max(125.8)),
});

export const Route = createFileRoute("/result")({
    component: ResultComponent,
    validateSearch: searchSchema.parse,
});

function ResultComponent() {
    const navigate = useNavigate();
    const { lat, lng } = Route.useSearch();

    const { data, error, isPending, isError, isSuccess, refetch } = useQuery({
        queryKey: ["flood-risk-prediction", lat, lng],
        queryFn: () => predictFloodRisk(lat, lng),
    });

    const errorMessage =
        error instanceof Error
            ? error.message
            : "Failed to fetch flood prediction data.";

    const handleBack = () => navigate({ to: "/" });

    const handleDownload = () => {
        // Placeholder for future implementation
        alert("Download feature will be available once backend is integrated.");
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                                Flood Risk Assessment
                            </h1>
                            <p className="text-sm md:text-base text-muted-foreground mt-1">
                                Location: {lat.toFixed(6)}, {lng.toFixed(6)}
                            </p>
                        </div>
                        <Button
                            onClick={handleBack}
                            variant="outline"
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
                                    Unable to analyze this location.
                                </p>
                                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                    Please try again.
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
                        <Card className="sticky top-4 shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-foreground">
                                    Flood Susceptibility
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isPending ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-32 w-full rounded-lg" />
                                        <Skeleton className="h-8 w-3/4 mx-auto rounded-full" />
                                        <Skeleton className="h-4 w-full rounded" />
                                    </div>
                                ) : isSuccess && data ? (
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
                                                    className="w-full"
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Download Report
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Prediction data is unavailable.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {isPending ? (
                            <>
                                <Skeleton className="h-64 w-full rounded-xl" />
                                <Skeleton className="h-80 w-full rounded-xl" />
                            </>
                        ) : isSuccess && data ? (
                            <>
                                <ModelComparison
                                    baselineRf={data.baseline_rf}
                                    ensemble={data.ensemble}
                                />

                                <Interpretation
                                    riskLevel={data.ensemble.risk_level}
                                    probability={data.ensemble.probability}
                                />

                                <RegionalContext />

                                <Recommendations
                                    riskLevel={data.ensemble.risk_level}
                                />

                                <div className="flex items-center justify-between rounded-lg border bg-card p-4 text-sm">
                                    <p className="text-muted-foreground">
                                        Trained on flooded and unflooded points
                                        from Davao City using 8 conditioning factors.
                                    </p>
                                    <Button
                                        onClick={handleBack}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <ArrowLeft className="mr-1.5 h-3 w-3" />
                                        New Analysis
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <Card>
                                <CardContent className="pt-6 text-sm text-muted-foreground">
                                    No prediction result to display yet.
                                </CardContent>
                            </Card>
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
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">
                    Recommendations
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                    {isHighRisk ? (
                        <>
                            <RecommendationItem icon={<AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />}>
                                High flood susceptibility detected. Consider
                                flood mitigation measures if planning
                                construction or development.
                            </RecommendationItem>
                            <RecommendationItem icon={<HardHat className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />}>
                                Implement elevated foundations, proper drainage
                                systems, and flood-resistant building materials.
                            </RecommendationItem>
                            <RecommendationItem icon={<Bell className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />}>
                                Stay informed about weather conditions and have
                                an emergency evacuation plan during monsoon
                                season.
                            </RecommendationItem>
                        </>
                    ) : isModerate ? (
                        <>
                            <RecommendationItem icon={<Zap className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />}>
                                Moderate risk detected. Consider preventive
                                measures such as improved drainage systems.
                            </RecommendationItem>
                            <RecommendationItem icon={<CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />}>
                                Monitor local weather patterns and maintain
                                awareness during heavy rainfall events.
                            </RecommendationItem>
                        </>
                    ) : (
                        <>
                            <RecommendationItem icon={<CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />}>
                                Low flood risk detected. This location appears
                                relatively safe based on terrain and
                                environmental factors.
                            </RecommendationItem>
                            <RecommendationItem icon={<Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />}>
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
    children,
}: {
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="flex gap-2">
            {icon}
            <p>{children}</p>
        </div>
    );
}
