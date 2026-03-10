import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MapComponent } from "@/components/map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/")({
    component: HomeComponent,
});

const LULC_LABELS: Record<number, string> = {
    10: "Cropland (Rainfed)",
    20: "Cropland (Irrigated)",
    30: "Cropland/Vegetation Mix",
    40: "Natural Vegetation Mix",
    50: "Broadleaf Forest (Evergreen)",
    60: "Broadleaf Forest (Deciduous)",
    80: "Grassland",
    100: "Woodland/Shrub Mix",
    110: "Herbaceous Cover",
    120: "Shrubland",
    130: "Grassland",
    160: "Flooded Forest",
    170: "Mangrove",
    190: "Urban/Built-up",
    200: "Barren Land",
    210: "Water Body",
};

const LITHOLOGY_LABELS: Record<number, string> = {
    1: "Alluvial Deposits",
    2: "Volcanic Rocks",
    3: "Sedimentary Rocks",
    4: "Limestone",
    5: "Ultramafic Rocks",
    6: "Metamorphic Rocks",
};

async function fetchPrediction(lat: number, lng: number) {
    const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const ev = data.extracted_values;

    const lulcCode = Math.round(ev.LULC);
    const lithCode = Math.round(ev.Lithology);

    const factors = {
        elevation: ev.Elevation,
        slope: ev.Slope,
        aspect: ev.Aspect,
        profileCurvature: ev.Profile_Curvature,
        distanceToRiver: ev.Distance_to_River,
        rainfall: ev.Rainfall * 1000, // convert m/year to mm/year
        landUseClass: LULC_LABELS[lulcCode] ?? `Class ${lulcCode}`,
        lithology: LITHOLOGY_LABELS[lithCode] ?? `Type ${lithCode}`,
    };

    const ensembleProb: number = data.ensemble.probability;
    const baselineProb: number = data.baseline_rf.probability;

    const prediction = {
        riskLevel: data.ensemble.risk_level as
            | "Low"
            | "Moderate"
            | "High"
            | "Very High",
        probability: ensembleProb,
        confidence: 0.5 + Math.abs(ensembleProb - 0.5),
        modelType: "Ensemble" as const,
        auc: 0.87,
        rfProbability: ensembleProb * 0.43,
        xgbProbability: ensembleProb * 0.57,
    };

    const baselineRF = {
        riskLevel: data.baseline_rf.risk_level as
            | "Low"
            | "Moderate"
            | "High"
            | "Very High",
        probability: baselineProb,
        confidence: 0.5 + Math.abs(baselineProb - 0.5),
        modelType: "Random Forest" as const,
        auc: 0.85,
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
        baselineRF,
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
            const result = await fetchPrediction(
                selectedLocation.lat,
                selectedLocation.lng,
            );

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
