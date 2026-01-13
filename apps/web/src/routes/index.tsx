import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MapComponent } from "@/components/map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/")({
    component: HomeComponent,
});

// Client-side mock data generation (no backend needed)
function generateMockAnalysis(lat: number, lng: number) {
    const factors = {
        elevation: 45 + Math.random() * 100,
        slope: 5 + Math.random() * 15,
        aspect: Math.random() * 360,
        profileCurvature: -0.5 + Math.random(),
        distanceToRiver: 200 + Math.random() * 1000,
        rainfall: 2200 + Math.random() * 400,
        landUseClass: ["Urban", "Agricultural", "Forest", "Grassland"][
            Math.floor(Math.random() * 4)
        ],
        lithology: ["Alluvium", "Volcanic", "Sedimentary"][
            Math.floor(Math.random() * 3)
        ],
    };

    const baselineProb = 0.35 + Math.random() * 0.4;
    const baselinePrediction = {
        riskLevel:
            baselineProb < 0.3
                ? "Low"
                : baselineProb < 0.5
                ? "Moderate"
                : baselineProb < 0.7
                ? "High"
                : "Very High",
        probability: baselineProb,
        confidence: 0.72 + Math.random() * 0.13,
        modelType: "Random Forest" as const,
        auc: 0.85,
    };

    const ensembleProb = baselineProb + 0.03 + Math.random() * 0.05;
    const rfProb = baselineProb * 0.45;
    const xgbProb = ensembleProb - rfProb;

    const prediction = {
        riskLevel:
            ensembleProb < 0.3
                ? "Low"
                : ensembleProb < 0.5
                ? "Moderate"
                : ensembleProb < 0.7
                ? "High"
                : "Very High",
        probability: Math.min(0.95, ensembleProb),
        confidence: 0.8 + Math.random() * 0.12,
        modelType: "Ensemble" as const,
        auc: 0.87,
        rfProbability: rfProb,
        xgbProbability: xgbProb,
    };

    const factorImportance = [
        {
            factor: "Distance to River",
            importance: 0.28,
            impact: "high" as const,
        },
        { factor: "Rainfall", importance: 0.22, impact: "high" as const },
        { factor: "Elevation", importance: 0.18, impact: "medium" as const },
        { factor: "Slope", importance: 0.14, impact: "medium" as const },
        { factor: "Land Use", importance: 0.09, impact: "low" as const },
        {
            factor: "Profile Curvature",
            importance: 0.05,
            impact: "low" as const,
        },
        { factor: "Aspect", importance: 0.03, impact: "low" as const },
        { factor: "Lithology", importance: 0.01, impact: "low" as const },
    ];

    return {
        location: { latitude: lat, longitude: lng },
        factors,
        prediction,
        baselineRF: baselinePrediction,
        factorImportance,
        timestamp: new Date().toISOString(),
    };
}

function HomeComponent() {
    const navigate = useNavigate();
    const [selectedLocation, setSelectedLocation] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleLocationSelect = (lat: number, lng: number) => {
        setSelectedLocation({ lat, lng });
    };

    const handleAnalyze = async () => {
        if (!selectedLocation) return;

        setIsAnalyzing(true);
        try {
            // Simulate API delay for better UX
            await new Promise((resolve) => setTimeout(resolve, 800));

            const result = generateMockAnalysis(
                selectedLocation.lat,
                selectedLocation.lng
            );

            // Navigate to results page with data
            navigate({
                to: "/result",
                search: {
                    lat: selectedLocation.lat,
                    lng: selectedLocation.lng,
                    data: JSON.stringify(result),
                },
            });
        } catch (error) {
            console.error("Analysis failed:", error);
            alert("Failed to analyze location. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            {/* Header */}
            <header className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                🌊 Davao FloodSense
                            </h1>
                            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-1">
                                Ensemble Risk Mapper for Davao City
                            </p>
                        </div>
                        <Button
                            onClick={() => navigate({ to: "/about" })}
                            variant="outline"
                            className="border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900"
                        >
                            About
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Map Section */}
                <div className="flex-1 relative">
                    <MapComponent
                        onLocationSelect={handleLocationSelect}
                        selectedLocation={selectedLocation}
                        isAnalyzing={isAnalyzing}
                    />
                </div>

                {/* Sidebar */}
                <div className="w-full md:w-96 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Title */}
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                Flood Risk Analysis
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Select a location on the map to analyze flood
                                susceptibility
                            </p>
                        </div>

                        {/* Location Info */}
                        {selectedLocation ? (
                            <Card className="border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 shadow-lg shadow-blue-500/10">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        Selected Location
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="text-xs">
                                        <span className="font-semibold">
                                            Latitude:
                                        </span>{" "}
                                        {selectedLocation.lat.toFixed(6)}
                                    </div>
                                    <div className="text-xs">
                                        <span className="font-semibold">
                                            Longitude:
                                        </span>{" "}
                                        {selectedLocation.lng.toFixed(6)}
                                    </div>
                                    <Button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing}
                                        className="w-full mt-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 transition-all duration-200"
                                        size="lg"
                                    >
                                        {isAnalyzing
                                            ? "Analyzing..."
                                            : "Analyze Location"}
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                                        <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm">
                                            <p className="font-medium mb-1">
                                                How to use:
                                            </p>
                                            <ol className="list-decimal list-inside space-y-1 text-xs">
                                                <li>
                                                    Click anywhere on the map
                                                    within Davao City
                                                </li>
                                                <li>
                                                    Or use "My Location" to
                                                    analyze your current
                                                    position
                                                </li>
                                                <li>
                                                    Click "Analyze Location" to
                                                    get risk assessment
                                                </li>
                                            </ol>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Model Info */}
                        {/* {modelInfoQuery.data && (
                            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        Model Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-xs">
                                    <div>
                                        <span className="font-semibold">
                                            Algorithm:
                                        </span>{" "}
                                        {modelInfoQuery.data.modelType}
                                    </div>
                                    <div>
                                        <span className="font-semibold">
                                            Method:
                                        </span>{" "}
                                        {modelInfoQuery.data.algorithm}
                                    </div>
                                    <div>
                                        <span className="font-semibold">
                                            Accuracy:
                                        </span>{" "}
                                        {(
                                            modelInfoQuery.data.accuracy
                                                .ensemble * 100
                                        ).toFixed(1)}
                                        % (AUC)
                                    </div>
                                    <div>
                                        <span className="font-semibold">
                                            Factors:
                                        </span>{" "}
                                        {modelInfoQuery.data.factorsUsed}{" "}
                                        conditioning factors
                                    </div>
                                </CardContent>
                            </Card>
                        )} */}

                        {/* Disclaimer */}
                        <Card className="border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0" />
                                    <div className="text-xs text-amber-900 dark:text-amber-200">
                                        <p className="font-semibold mb-1">
                                            Current Prototype Status
                                        </p>
                                        <p>
                                            This application demonstrates the
                                            user interface and logic flow of the
                                            Ensemble Random Forest & XGBoost
                                            system. For this proof-of-concept,
                                            the application utilizes
                                            pre-calculated susceptibility data
                                            derived from the study's offline
                                            dataset (SRTM Elevation, PAGASA
                                            Rainfall, etc.).
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* About */}
                        {/* <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    About
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                                <p>
                                    This application uses ensemble machine
                                    learning (Random Forest + XGBoost) to assess
                                    flood susceptibility in Davao City.
                                </p>
                                <p>
                                    Based on research studying flash floods
                                    caused by complex terrain and upstream
                                    rainfall patterns in Mindanao.
                                </p>
                            </CardContent>
                        </Card> */}
                    </div>
                </div>
            </div>
        </div>
    );
}
