/**
 * Map Component - Interactive OpenStreetMap with location selection
 */

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { Button } from "./ui/button";
import { MapPin, Layers, Loader2 } from "lucide-react";
import { utmToWgs84 } from "@/lib/utm-converter";

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

export function MapComponent({
    onLocationSelect,
    selectedLocation,
    isAnalyzing,
}: MapComponentProps) {
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [showLayers, setShowLayers] = useState(false);
    const [activeLayer, setActiveLayer] = useState<string>("base");
    const boundaryRef = useRef<Array<[number, number]> | null>(null);

    const isPointInPolygon = (
        lat: number,
        lng: number,
        poly: Array<[number, number]>
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
            zoomControl: true,
        });

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
                alert(
                    "Please select a location within the Davao City boundary"
                );
                return;
            }

            onLocationSelect(lat, lng);
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
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
        Lat: ${selectedLocation.lat.toFixed(6)}<br/>
        Lng: ${selectedLocation.lng.toFixed(6)}
      </div>
    `
            )
            .openPopup();

        markerRef.current = marker;
    }, [selectedLocation]);

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
                            boundaryRef.current
                        )
                    ) {
                        alert(
                            "Your location is outside Davao City. Please select within the boundary."
                        );
                        return;
                    }

                    onLocationSelect(latitude, longitude);
                    mapRef.current?.setView([latitude, longitude], 14);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    alert(
                        "Unable to get your location. Please click on the map to select a location."
                    );
                }
            );
        } else {
            alert(
                "Geolocation is not supported by your browser. Please click on the map to select a location."
            );
        }
    };

    const toggleLayer = (layer: string) => {
        setActiveLayer(layer);
        // In a full implementation, this would switch between different data layers
        // For prototype, we'll just track the selection
    };

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Floating controls */}
            <div className="absolute top-4 right-4 z-1000 flex flex-col gap-2">
                <Button
                    onClick={handleMyLocation}
                    disabled={isAnalyzing}
                    className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
                    size="lg"
                >
                    <MapPin className="mr-2 h-5 w-5" />
                    My Location
                </Button>

                <Button
                    onClick={() => setShowLayers(!showLayers)}
                    variant="outline"
                    className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
                    size="lg"
                >
                    <Layers className="mr-2 h-5 w-5" />
                    Layers
                </Button>
            </div>

            {/* Layer selector panel */}
            {showLayers && (
                <div className="absolute top-32 right-4 z-1000 bg-white rounded-lg shadow-xl p-4 w-64">
                    <h3 className="font-semibold mb-3 text-sm">Map Layers</h3>
                    <div className="space-y-2">
                        {[
                            {
                                id: "base",
                                name: "Base Map",
                                desc: "OpenStreetMap",
                            },
                            {
                                id: "slope",
                                name: "Slope Gradient",
                                desc: "Black to White scale",
                            },
                            {
                                id: "distance",
                                name: "Distance to River",
                                desc: "Proximity analysis",
                            },
                            {
                                id: "rainfall",
                                name: "Rainfall",
                                desc: "Mindanao context",
                            },
                            {
                                id: "lulc",
                                name: "Land Use",
                                desc: "LULC classification",
                            },
                        ].map((layer) => (
                            <button
                                key={layer.id}
                                onClick={() => toggleLayer(layer.id)}
                                className={`w-full text-left p-2 rounded text-sm transition-colors ${
                                    activeLayer === layer.id
                                        ? "bg-blue-100 border-2 border-blue-500"
                                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                                }`}
                            >
                                <div className="font-medium">{layer.name}</div>
                                <div className="text-xs text-gray-600">
                                    {layer.desc}
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                        Active layer visualization is available in the full
                        version
                    </div>
                </div>
            )}

            {/* Loading overlay */}
            {isAnalyzing && (
                <div className="absolute inset-0 bg-black/40 z-999 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        <span className="font-medium">
                            Analyzing location...
                        </span>
                    </div>
                </div>
            )}

            {/* Instructions */}
            {!selectedLocation && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-1000 bg-white rounded-lg shadow-xl p-4 max-w-md">
                    <p className="text-sm text-center">
                        <strong>Click anywhere on the map</strong> within the
                        blue boundary (Davao City) to analyze flood risk, or use{" "}
                        <strong>"My Location"</strong> button
                    </p>
                </div>
            )}
        </div>
    );
}
