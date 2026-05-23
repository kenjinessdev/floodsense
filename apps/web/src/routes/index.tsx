import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MapComponent } from "@/components/map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Info, AlertCircle } from "lucide-react";
import { DISTRICT_LANDMARKS, type Landmark } from "@/lib/landmarks";

interface DistrictCentroid {
    name: string;
    lat: number;
    lon: number;
    type?: string;
}

interface QuickNavRegion {
    name: string;
    center: [number, number];
    zoom: number;
}

interface GoToRegionTarget {
    center: [number, number];
    zoom: number;
    requestId: number;
}

const QUICK_NAV_CACHE_KEY = "floodsense.quick-nav.districts.v1";

const isDistrictCentroidArray = (value: unknown): value is DistrictCentroid[] =>
    Array.isArray(value) &&
    value.every((item) => {
        if (typeof item !== "object" || !item) return false;
        const candidate = item as Partial<DistrictCentroid>;
        return (
            typeof candidate.name === "string" &&
            typeof candidate.lat === "number" &&
            typeof candidate.lon === "number"
        );
    });

export const Route = createFileRoute("/")({
    component: HomeComponent,
});

function HomeComponent() {
    const navigate = useNavigate();
    const [selectedLocation, setSelectedLocation] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const [quickNavDistricts, setQuickNavDistricts] = useState<
        QuickNavRegion[]
    >([]);
    const [isQuickNavLoading, setIsQuickNavLoading] = useState(true);
    const [goToRegionTarget, setGoToRegionTarget] =
        useState<GoToRegionTarget | null>(null);
    const [districtQuery, setDistrictQuery] = useState("");
    const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);

    useEffect(() => {
        const loadQuickNavDistricts = async () => {
            try {
                const cached = sessionStorage.getItem(QUICK_NAV_CACHE_KEY);
                if (cached) {
                    try {
                        const cachedValue = JSON.parse(cached) as unknown;
                        if (
                            Array.isArray(cachedValue) &&
                            cachedValue.every(
                                (item) =>
                                    typeof item === "object" &&
                                    item !== null &&
                                    typeof (item as { name?: unknown }).name ===
                                        "string" &&
                                    Array.isArray(
                                        (item as { center?: unknown }).center,
                                    ) &&
                                    typeof (item as { zoom?: unknown }).zoom ===
                                        "number",
                            )
                        ) {
                            setQuickNavDistricts(
                                cachedValue as QuickNavRegion[],
                            );
                            return;
                        }
                    } catch {
                        sessionStorage.removeItem(QUICK_NAV_CACHE_KEY);
                    }
                }

                const response = await fetch("/districts.json");
                if (!response.ok) {
                    throw new Error(
                        `Failed to load districts.json (${response.status})`,
                    );
                }

                const payload = (await response.json()) as unknown;
                if (!isDistrictCentroidArray(payload)) {
                    throw new Error("districts.json has invalid shape");
                }

                const districts = payload
                    .filter((item) => !item.type || item.type === "district")
                    .map((item) => ({
                        name: item.name,
                        center: [item.lat, item.lon] as [number, number],
                        zoom: 14,
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name));

                setQuickNavDistricts(districts);
                sessionStorage.setItem(
                    QUICK_NAV_CACHE_KEY,
                    JSON.stringify(districts),
                );
            } catch (error: unknown) {
                console.error(
                    "Failed to load quick navigation districts:",
                    error,
                );
                setQuickNavDistricts([]);
            } finally {
                setIsQuickNavLoading(false);
            }
        };

        void loadQuickNavDistricts();
    }, []);

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

    const handleGoToDistrict = (region: QuickNavRegion) => {
        setGoToRegionTarget({
            center: region.center,
            zoom: region.zoom,
            requestId: Date.now(),
        });
    };

    const handleLandmarkClick = (landmark: Landmark) => {
        setSelectedLocation({ lat: landmark.lat, lng: landmark.lng });
        setGoToRegionTarget({
            center: [landmark.lat, landmark.lng],
            zoom: 16,
            requestId: Date.now(),
        });
        navigate({
            to: "/result",
            search: {
                lat: landmark.lat,
                lng: landmark.lng,
            },
        });
    };

    const filteredQuickNavDistricts = useMemo(() => {
        const query = districtQuery.trim().toLowerCase();
        if (!query) return quickNavDistricts;

        return quickNavDistricts.filter((region) =>
            region.name.toLowerCase().includes(query),
        );
    }, [quickNavDistricts, districtQuery]);

    return (
        <div className="h-svh flex flex-col bg-background">
            {/* Header - compact on mobile */}
            <header className="border-b bg-background/80 backdrop-blur-xl shrink-0">
                <div className="px-4 py-2.5 md:py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg md:text-3xl font-bold text-foreground">
                                Davao FloodSense
                            </h1>
                            <p className="hidden md:block text-sm text-muted-foreground mt-0.5">
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
                        goToRegionTarget={goToRegionTarget}
                    />

                    {/* Mobile bottom overlay panel */}
                    <div className="md:hidden absolute bottom-0 left-0 right-0 z-1001 p-3 pointer-events-none">
                        {selectedLocation ? (
                            <div className="bg-background/95 backdrop-blur-md rounded-xl shadow-xl border border-border p-4 pointer-events-auto">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                            Selected Location
                                        </p>
                                        <p className="text-sm font-semibold text-foreground mt-0.5">
                                            {selectedLocation.lat.toFixed(5)},{" "}
                                            {selectedLocation.lng.toFixed(5)}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleAnalyze}
                                    className="w-full"
                                    size="lg"
                                >
                                    Analyze Location
                                </Button>
                            </div>
                        ) : (
                            <div className="bg-background/90 backdrop-blur-md rounded-xl shadow-lg border border-border px-4 py-3 pointer-events-auto text-center">
                                <p className="text-xs text-muted-foreground">
                                    <strong className="text-foreground">
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
                <div className="hidden md:flex md:w-96 bg-card border-l border-border overflow-y-auto flex-col">
                    <div className="p-6 space-y-6">
                        {/* Title */}
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-2">
                                Flood Risk Analysis
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Select a location on the map to analyze flood
                                susceptibility
                            </p>
                        </div>

                        {/* Location Info */}
                        {selectedLocation ? (
                            <Card className="border-primary/30 bg-accent/20 shadow-lg">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-accent-foreground">
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
                                        className="w-full mt-3"
                                        size="lg"
                                    >
                                        Analyze Location
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-border bg-card">
                                <CardContent>
                                    <div className="flex items-start gap-3 text-muted-foreground">
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

                        <Card className="border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-foreground">
                                    Go to District
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isQuickNavLoading &&
                                quickNavDistricts.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        Loading districts...
                                    </p>
                                ) : quickNavDistricts.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        No districts available.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        <Input
                                            value={districtQuery}
                                            onChange={(event) =>
                                                setDistrictQuery(
                                                    event.currentTarget.value,
                                                )
                                            }
                                            placeholder="Search district..."
                                            className="h-8"
                                        />

                                        {filteredQuickNavDistricts.length ===
                                        0 ? (
                                            <p className="text-xs text-muted-foreground">
                                                No matching districts.
                                            </p>
                                        ) : (
                                            <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                                                {filteredQuickNavDistricts.map(
                                                    (region) => {
                                                        const landmarks =
                                                            DISTRICT_LANDMARKS.find(
                                                                (dl) =>
                                                                    dl.district ===
                                                                    region.name,
                                                            )?.landmarks ?? [];
                                                        const isExpanded =
                                                            expandedDistrict ===
                                                            region.name;
                                                        return (
                                                            <div
                                                                key={
                                                                    region.name
                                                                }
                                                            >
                                                                <button
                                                                    onClick={() => {
                                                                        setExpandedDistrict(
                                                                            isExpanded
                                                                                ? null
                                                                                : region.name,
                                                                        );
                                                                    }}
                                                                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                                                                >
                                                                    <span className="font-medium">
                                                                        {
                                                                            region.name
                                                                        }
                                                                    </span>
                                                                    {isExpanded ? (
                                                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                                    ) : (
                                                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                                    )}
                                                                </button>
                                                                {isExpanded &&
                                                                    landmarks.length >
                                                                        0 && (
                                                                        <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-border pl-2">
                                                                            {landmarks.map(
                                                                                (
                                                                                    landmark,
                                                                                ) => (
                                                                                    <button
                                                                                        key={
                                                                                            landmark.name
                                                                                        }
                                                                                        onClick={() =>
                                                                                            handleLandmarkClick(
                                                                                                landmark,
                                                                                            )
                                                                                        }
                                                                                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-xs hover:bg-accent transition-colors text-left"
                                                                                    >
                                                                                        <span className="flex-1 truncate">
                                                                                            {
                                                                                                landmark.name
                                                                                            }
                                                                                        </span>
                                                                                    </button>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Disclaimer */}
                        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20">
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
