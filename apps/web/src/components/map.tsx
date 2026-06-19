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
    goToRegionTarget?: {
        center: [number, number];
        zoom: number;
        requestId: number;
    } | null;
    onMapReady?: (map: L.Map) => void;
}

export function MapComponent({
    onLocationSelect,
    selectedLocation,
    isAnalyzing,
    goToRegionTarget,
    onMapReady,
}: MapComponentProps) {
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const boundaryRef = useRef<Array<[number, number]> | null>(null);
    const lastGeocodedKeyRef = useRef<string>("");
    const onLocationSelectRef = useRef(onLocationSelect);
    const onMapReadyRef = useRef(onMapReady);
    onLocationSelectRef.current = onLocationSelect;
    onMapReadyRef.current = onMapReady;
    const [selectedAddress, setSelectedAddress] = useState<string>(
        "Reverse geocoding is unavailable as of the moment.",
    );

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
            center: [7.07, 125.61],
            zoom: 12,
            zoomControl: false,
            preferCanvas: true,
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
                if (!feature?.geometry) return;

                const geom = feature.geometry;
                let shell: Array<[number, number]>;

                if (geom.type === "MultiPolygon") {
                    shell = (
                        geom.coordinates[0][0] as Array<[number, number]>
                    ).map(([e, n]) => utmToWgs84(e, n));
                } else if (geom.type === "Polygon") {
                    shell = (
                        geom.coordinates[0] as Array<[number, number]>
                    ).map(([e, n]) => utmToWgs84(e, n));
                } else {
                    return;
                }

                boundaryRef.current = shell;

                const lngLatShell = shell.map(([lat, lng]) => [lng, lat]);
                const geoJson = {
                    type: "FeatureCollection" as const,
                    features: [
                        {
                            type: "Feature" as const,
                            geometry: {
                                type: "MultiPolygon" as const,
                                coordinates: [[lngLatShell]],
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

            onLocationSelectRef.current(lat, lng);
            lastGeocodedKeyRef.current = `${lat},${lng}`;
            setSelectedAddress("Resolving location...");

            void reverseGeocode(lat, lng)
                .then((address) => {
                    setSelectedAddress(address);
                })
                .catch((error: unknown) => {
                    console.error("Reverse geocoding error:", error);
                    setSelectedAddress(
                        "Reverse geocoding is unavailable as of the moment.",
                    );
                });
        });

        mapRef.current = map;
        onLocationSelectRef.current = onLocationSelect;

        onMapReadyRef.current?.(map);

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!mapRef.current || !goToRegionTarget) return;
        mapRef.current.setView(goToRegionTarget.center, goToRegionTarget.zoom);
    }, [goToRegionTarget]);

    // Reverse-geocode when location is set externally (e.g. landmarks sidebar)
    useEffect(() => {
        if (!selectedLocation) return;
        const key = `${selectedLocation.lat},${selectedLocation.lng}`;
        if (lastGeocodedKeyRef.current === key) return;
        lastGeocodedKeyRef.current = key;

        setSelectedAddress("Resolving location...");
        void reverseGeocode(selectedLocation.lat, selectedLocation.lng)
            .then((address) => {
                setSelectedAddress(address);
            })
            .catch((error: unknown) => {
                console.error("Reverse geocoding error:", error);
                setSelectedAddress(
                    "Reverse geocoding is unavailable as of the moment.",
                );
            });
    }, [selectedLocation]);

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
                    lastGeocodedKeyRef.current = `${latitude},${longitude}`;
                    setSelectedAddress("Resolving location...");

                    void reverseGeocode(latitude, longitude)
                        .then((address) => {
                            setSelectedAddress(address);
                        })
                        .catch((error: unknown) => {
                            console.error("Reverse geocoding error:", error);
                            setSelectedAddress(
                                "Reverse geocoding is unavailable as of the moment.",
                            );
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

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Floating controls */}
            <div className="absolute top-3 right-3 z-1000">
                <Button
                    onClick={handleMyLocation}
                    disabled={isAnalyzing}
                    variant="secondary"
                    size="sm"
                >
                    <MapPin className="mr-1.5 h-4 w-4" />
                    My Location
                </Button>
            </div>

            {/* Loading overlay */}
            {isAnalyzing && (
                <div className="absolute inset-0 bg-foreground/40 z-999 flex items-center justify-center">
                    <div className="bg-card rounded-xl p-6 shadow-xl flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="font-medium">
                            Analyzing location...
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
