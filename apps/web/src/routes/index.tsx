import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MapComponent } from "@/components/map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/")({
    component: HomeComponent,
});

function HomeComponent() {
    const navigate = useNavigate();
    const [selectedLocation, setSelectedLocation] = useState<{
        lat: number;
        lng: number;
    } | null>(null);

    const handleLocationSelect = (lat: number, lng: number) => {
        setSelectedLocation({ lat, lng });
    };

    const handleAnalyze = () => {
        if (!selectedLocation) return;
        navigate({
            to: "/result",
            search: {
                lat: selectedLocation.lat,
                lng: selectedLocation.lng,
            },
        });
    };

    return (
        <div className="h-svh flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Header - compact on mobile */}
            <header className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shrink-0">
                <div className="px-4 py-2.5 md:py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg md:text-3xl font-bold bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                🌊 Davao FloodSense
                            </h1>
                            <p className="hidden md:block text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                                Ensemble Risk Mapper for Davao City
                            </p>
                        </div>
                        <Button
                            onClick={() => navigate({ to: "/about" })}
                            variant="outline"
                            size="sm"
                        >
                            About
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
                {/* Map — fills full area on mobile (overlay handles controls) */}
                <div className="flex-1 relative min-h-0">
                    <MapComponent
                        onLocationSelect={handleLocationSelect}
                        selectedLocation={selectedLocation}
                        isAnalyzing={false}
                    />

                    {/* Mobile bottom overlay panel */}
                    <div className="md:hidden absolute bottom-0 left-0 right-0 z-1001 p-3 pointer-events-none">
                        {selectedLocation ? (
                            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 p-4 pointer-events-auto">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">
                                            Selected Location
                                        </p>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                                            {selectedLocation.lat.toFixed(5)},{" "}
                                            {selectedLocation.lng.toFixed(5)}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleAnalyze}
                                    className="w-full bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30"
                                    size="lg"
                                >
                                    Analyze Location
                                </Button>
                            </div>
                        ) : (
                            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 px-4 py-3 pointer-events-auto text-center">
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                    <strong className="text-slate-800 dark:text-slate-200">
                                        Tap the map
                                    </strong>{" "}
                                    within the blue boundary to analyze flood
                                    risk
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar — desktop only */}
                <div className="hidden md:flex md:w-96 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 overflow-y-auto flex-col">
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
                            <Card className="border-blue-200 dark:border-blue-900/50 bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 shadow-lg shadow-blue-500/10">
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
                                        disabled={!selectedLocation}
                                        className="w-full mt-3 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        size="lg"
                                    >
                                        Analyze Location
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-slate-200 dark:border-slate-800 bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
                                <CardContent>
                                    <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                                        <Info className="h-5 w-5 mt-0.5 shrink-0" />
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

                        {/* Disclaimer */}
                        <Card className="border-amber-200 dark:border-amber-900/50 bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                            <CardContent>
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
                    </div>
                </div>
            </div>
        </div>
    );
}
