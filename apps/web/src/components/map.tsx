/**
 * Map Component - Interactive OpenStreetMap with location selection
 */

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { MapPin, Loader2 } from "lucide-react";
import { utmToWgs84 } from "@/lib/utm-converter";
import { reverseGeocode } from "@/lib/reverse-geocode";

// Fix default marker icon issue in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapComponentProps {
    onLocationSelect: (lat: number, lng: number) => void;
    selectedLocation: { lat: number; lng: number } | null;
    isAnalyzing: boolean;
}

interface QuickNavRegion {
    name: string;
    center: [number, number];
    zoom: number;
}

interface OverpassElement {
    tags?: {
        name?: string;
        admin_level?: string;
    };
    center?: {
        lat?: number;
        lon?: number;
    };
}

interface OverpassResponse {
    elements?: OverpassElement[];
}

const QUICK_NAV_CACHE_KEY = "floodsense.quick-nav.regions.v2";
const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const OVERPASS_QUERY = `[out:json][timeout:60];
area["name"="Davao City"]["admin_level"="6"]->.davao;
(
  relation["boundary"="administrative"]["admin_level"~"^(9|10)$"](area.davao);
);
out tags center;`;

const isQuickNavRegionArray = (value: unknown): value is QuickNavRegion[] =>
    Array.isArray(value) &&
    value.every((region) => {
        if (typeof region !== "object" || !region) return false;
        const item = region as Partial<QuickNavRegion>;
        return (
            typeof item.name === "string" &&
            Array.isArray(item.center) &&
            item.center.length === 2 &&
            typeof item.center[0] === "number" &&
            typeof item.center[1] === "number" &&
            typeof item.zoom === "number"
        );
    });

const buildQuickNavRegionsFromOverpass = (
    payload: OverpassResponse,
): QuickNavRegion[] => {
    const unique = new Map<string, QuickNavRegion>();

    for (const element of payload.elements ?? []) {
        const name = element.tags?.name?.trim();
        const lat = element.center?.lat;
        const lon = element.center?.lon;

        if (!name || typeof lat !== "number" || typeof lon !== "number") {
            continue;
        }

        if (!unique.has(name)) {
            unique.set(name, {
                name,
                center: [lat, lon],
                zoom: 14,
            });
        }
    }

    const regions = Array.from(unique.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
    );

    if (regions.length === 0) {
        throw new Error("No admin-level centroid data found from Overpass.");
    }

    return regions;
};

export function MapComponent({
    onLocationSelect,
    selectedLocation,
    isAnalyzing,
}: MapComponentProps) {
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const boundaryRef = useRef<Array<[number, number]> | null>(null);
    const [selectedAddress, setSelectedAddress] =
        useState<string>("Unknown location");
    const [isQuickNavOpen, setIsQuickNavOpen] = useState(false);
    const [quickNavRegions, setQuickNavRegions] = useState<QuickNavRegion[]>(
        [],
    );
    const [isQuickNavLoading, setIsQuickNavLoading] = useState(true);

    const isPointInPolygon = (
        lat: number,
        lng: number,
        poly: Array<[number, number]>,
    ): boolean => {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const [yi, xi] = poly[i];
            const [yj, xj] = poly[j];
            const intersect =
                yi > lat !== yj > lat &&
                lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }
        return inside;
    };

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        // Initialize map centered on Davao City
        const map = L.map(mapContainerRef.current, {
            center: [7.07, 125.61], // Davao City center
            zoom: 12,
            zoomControl: false,
        });

        // Keep zoom controls at bottom-right so quick navigation can sit above.
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Add OpenStreetMap tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 18,
        }).addTo(map);

        // Load and render Davao City boundary
        axios
            .get("/final_davao_city_boundary.geojson")
            .then((res) => {
                const feature = res.data.features?.[0];
                if (feature?.geometry?.type === "MultiPolygon") {
                    const coords = feature.geometry.coordinates[0][0] as Array<
                        [number, number]
                    >;
                    const wgs84Ring = coords.map(([e, n]) => utmToWgs84(e, n));
                    boundaryRef.current = wgs84Ring;

                    const geoJson = {
                        type: "FeatureCollection" as const,
                        features: [
                            {
                                type: "Feature" as const,
                                geometry: {
                                    type: "MultiPolygon" as const,
                                    coordinates: [
                                        [
                                            wgs84Ring.map(([lat, lng]) => [
                                                lng,
                                                lat,
                                            ]),
                                        ],
                                    ],
                                },
                                properties: {},
                            },
                        ],
                    };

                    const layer = L.geoJSON(geoJson as any, {
                        style: {
                            color: "#3b82f6",
                            weight: 2,
                            fillOpacity: 0,
                            dashArray: "5, 10",
                        },
                    }).addTo(map);

                    map.fitBounds(layer.getBounds(), { padding: [32, 32] });
                }
            })
            .catch((err) => console.error("Failed to load boundary:", err));

        // Add click handler to place marker
        map.on("click", (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;

            if (
                !boundaryRef.current ||
                !isPointInPolygon(lat, lng, boundaryRef.current)
            ) {
                toast.error("Outside Davao City", {
                    description:
                        "Please select a location within the Davao City boundary.",
                });
                return;
            }

            onLocationSelect(lat, lng);
            setSelectedAddress("Resolving location...");

            void reverseGeocode(lat, lng)
                .then((address) => {
                    setSelectedAddress(address);
                })
                .catch((error: unknown) => {
                    console.error("Reverse geocoding error:", error);
                    setSelectedAddress("Unknown location");
                });
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        const loadQuickNavRegions = async () => {
            try {
                const cached = sessionStorage.getItem(QUICK_NAV_CACHE_KEY);
                if (cached) {
                    try {
                        const cachedValue = JSON.parse(cached) as unknown;
                        if (isQuickNavRegionArray(cachedValue)) {
                            setQuickNavRegions(cachedValue);
                            return;
                        }
                    } catch {
                        sessionStorage.removeItem(QUICK_NAV_CACHE_KEY);
                    }
                }

                const response = await fetch(OVERPASS_ENDPOINT, {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded; charset=UTF-8",
                    },
                    body: new URLSearchParams({
                        data: OVERPASS_QUERY,
                    }).toString(),
                });

                if (!response.ok) {
                    throw new Error(
                        `Overpass request failed with status ${response.status}.`,
                    );
                }

                const payload = (await response.json()) as OverpassResponse;
                const regions = buildQuickNavRegionsFromOverpass(payload);

                setQuickNavRegions(regions);
                sessionStorage.setItem(
                    QUICK_NAV_CACHE_KEY,
                    JSON.stringify(regions),
                );
            } catch (error: unknown) {
                console.error(
                    "Failed to load quick navigation regions:",
                    error,
                );
                setQuickNavRegions([]);
            } finally {
                setIsQuickNavLoading(false);
            }
        };

        void loadQuickNavRegions();
    }, []);

    // Update marker when location changes
    useEffect(() => {
        if (!mapRef.current || !selectedLocation) return;

        // Remove existing marker
        if (markerRef.current) {
            markerRef.current.remove();
        }

        // Add new marker
        const marker = L.marker([selectedLocation.lat, selectedLocation.lng], {
            icon: L.icon({
                iconUrl:
                    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
                iconRetinaUrl:
                    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
                shadowUrl:
                    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
            }),
        }).addTo(mapRef.current);

        marker
            .bindPopup(
                `
      <div class="text-sm">
        <strong>Selected Location</strong><br/>
                ${selectedAddress}
      </div>
    `,
            )
            .openPopup();

        markerRef.current = marker;
    }, [selectedLocation, selectedAddress]);

    const handleMyLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;

                    if (
                        !boundaryRef.current ||
                        !isPointInPolygon(
                            latitude,
                            longitude,
                            boundaryRef.current,
                        )
                    ) {
                        toast.error("Outside Davao City", {
                            description:
                                "Your location is outside Davao City. Please select a point within the boundary.",
                        });
                        return;
                    }

                    onLocationSelect(latitude, longitude);
                    setSelectedAddress("Resolving location...");

                    void reverseGeocode(latitude, longitude)
                        .then((address) => {
                            setSelectedAddress(address);
                        })
                        .catch((error: unknown) => {
                            console.error("Reverse geocoding error:", error);
                            setSelectedAddress("Unknown location");
                        });

                    mapRef.current?.setView([latitude, longitude], 14);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    toast.error("Location unavailable", {
                        description:
                            "Unable to get your location. Please click on the map to select a point.",
                    });
                },
            );
        } else {
            toast.error("Geolocation not supported", {
                description:
                    "Your browser does not support geolocation. Please click on the map to select a location.",
            });
        }
    };

    const handleGoToRegion = (center: [number, number], zoom: number) => {
        mapRef.current?.setView(center, zoom);
    };

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Floating controls */}
            <div className="absolute top-3 right-3 z-1000">
                <Button
                    onClick={handleMyLocation}
                    disabled={isAnalyzing}
                    className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
                    size="sm"
                >
                    <MapPin className="mr-1.5 h-4 w-4" />
                    My Location
                </Button>
            </div>

            <div className="absolute bottom-16 right-3 z-1000 flex flex-col items-end gap-2">
                {isQuickNavOpen && (
                    <div className="w-56 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
                        <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                            Quick Navigation
                        </p>
                        {isQuickNavLoading && quickNavRegions.length === 0 ? (
                            <p className="px-1 py-2 text-xs text-slate-500 dark:text-slate-300">
                                Loading regions...
                            </p>
                        ) : quickNavRegions.length === 0 ? (
                            <p className="px-1 py-2 text-xs text-slate-500 dark:text-slate-300">
                                No regions available.
                            </p>
                        ) : (
                            <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                                {quickNavRegions.map((region) => (
                                    <Button
                                        key={region.name}
                                        onClick={() =>
                                            handleGoToRegion(
                                                region.center,
                                                region.zoom,
                                            )
                                        }
                                        variant="outline"
                                        size="xs"
                                        className="justify-start"
                                    >
                                        {region.name}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <Button
                    onClick={() => setIsQuickNavOpen((open) => !open)}
                    variant="outline"
                    size="sm"
                    className="bg-white/95 shadow-lg backdrop-blur-sm text-slate-900 hover:bg-white dark:bg-slate-900/95 dark:text-slate-100 dark:hover:bg-slate-900"
                >
                    📍 Go to Region
                </Button>
            </div>

            {/* Loading overlay */}
            {isAnalyzing && (
                <div className="absolute inset-0 bg-black/40 z-999 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-6 shadow-xl flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        <span className="font-medium">
                            Analyzing location...
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
