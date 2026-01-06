/**
 * GeoFactor Class - Handles extraction of eight conditioning factors
 * for flood susceptibility mapping in Davao City
 */

export interface GeoFactorData {
    elevation: number; // meters above sea level
    slope: number; // degrees
    aspect: number; // degrees (0-360)
    profileCurvature: number; // curvature value
    distanceToRiver: number; // meters
    rainfall: number; // mm/year
    landUseClass: string; // LULC classification
    lithology: string; // geological classification
}

export interface Location {
    latitude: number;
    longitude: number;
}

export class GeoFactor {
    private location: Location;
    private factors: GeoFactorData | null = null;

    constructor(location: Location) {
        this.location = location;
    }

    /**
     * Extract all conditioning factors for the given location
     */
    async extractFactors(): Promise<GeoFactorData> {
        // In a real implementation, this would query GIS databases
        // For prototype, we generate realistic data based on location

        this.factors = {
            elevation: this.getElevation(),
            slope: this.getSlope(),
            aspect: this.getAspect(),
            profileCurvature: this.getProfileCurvature(),
            distanceToRiver: this.getDistanceToRiver(),
            rainfall: await this.getRegionalRainfall(),
            landUseClass: this.getLandUseClass(),
            lithology: this.getLithology(),
        };

        return this.factors;
    }

    /**
     * Get elevation based on location
     * Davao City elevation ranges from 0-2954m (Mt. Apo)
     */
    private getElevation(): number {
        // Simulate elevation based on distance from coast
        const distanceFromCoast = this.calculateDistanceFromCoast();
        // Lower elevations near coast (7.07°N, 125.61°E)
        return Math.max(0, Math.min(500, distanceFromCoast * 50));
    }

    /**
     * Get slope gradient (0-90 degrees)
     * Urban areas typically have lower slopes
     */
    private getSlope(): number {
        const elevation = this.getElevation();
        // Urban coastal areas have low slopes, mountainous areas have high slopes
        if (elevation < 50) return Math.random() * 5; // 0-5° for coastal
        if (elevation < 200) return 5 + Math.random() * 15; // 5-20° for lowlands
        return 20 + Math.random() * 30; // 20-50° for highlands
    }

    /**
     * Get aspect (direction of slope)
     */
    private getAspect(): number {
        return Math.random() * 360;
    }

    /**
     * Get profile curvature (-10 to +10)
     * Negative = concave (water accumulation), Positive = convex (water dispersion)
     */
    private getProfileCurvature(): number {
        const slope = this.getSlope();
        // Flat areas tend to accumulate water (negative curvature)
        if (slope < 5) return -5 + Math.random() * 3;
        return -3 + Math.random() * 6;
    }

    /**
     * Get distance to nearest river in meters
     * Closer to river = higher flood risk
     */
    private getDistanceToRiver(): number {
        // Simulate based on location
        // Davao River, Talomo River, Lipadas River are major waterways
        const isNearRiver = this.isInKnownFloodArea();
        if (isNearRiver) {
            return Math.random() * 100; // 0-100m from river
        }
        return 100 + Math.random() * 2000; // 100-2100m
    }

    /**
     * Get regional rainfall from Mindanao dataset
     * Davao City receives 1500-2500mm annually
     */
    private async getRegionalRainfall(): Promise<number> {
        // Simulate regional rainfall patterns
        // Eastern Mindanao (Pacific side) receives more rain
        const isEasternSide = this.location.longitude > 125.6;
        const baseRainfall = isEasternSide ? 2200 : 1800;
        return baseRainfall + (Math.random() * 400 - 200);
    }

    /**
     * Get Land Use/Land Cover classification
     */
    private getLandUseClass(): string {
        const elevation = this.getElevation();
        const isUrban = this.isInUrbanArea();

        if (isUrban) return "Urban Built-Up";
        if (elevation < 100) return "Agricultural Land";
        if (elevation < 300) return "Mixed Vegetation";
        return "Forest";
    }

    /**
     * Get lithology (geological classification)
     */
    private getLithology(): string {
        const elevation = this.getElevation();

        if (elevation < 50) return "Alluvial Deposits";
        if (elevation < 200) return "Sedimentary Rock";
        if (elevation < 500) return "Volcanic Rock";
        return "Metamorphic Rock";
    }

    /**
     * Helper: Calculate distance from coast (approximate)
     */
    private calculateDistanceFromCoast(): number {
        // Davao City coast is approximately at 7.07°N, 125.61°E
        const coastLat = 7.07;
        const coastLon = 125.61;

        const latDiff = this.location.latitude - coastLat;
        const lonDiff = this.location.longitude - coastLon;

        // Rough distance in km (simplified)
        return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111;
    }

    /**
     * Helper: Check if location is in known flood-prone area
     * Matina Pangi, Talomo, Buhangin are mentioned in study
     */
    private isInKnownFloodArea(): boolean {
        // Matina Pangi area: ~7.06°N, 125.61°E
        // Talomo area: ~7.05°N, 125.59°E
        const floodProneAreas = [
            { lat: 7.06, lon: 125.61, radius: 0.02 },
            { lat: 7.05, lon: 125.59, radius: 0.02 },
            { lat: 7.08, lon: 125.62, radius: 0.02 },
        ];

        return floodProneAreas.some((area) => {
            const distance = Math.sqrt(
                Math.pow(this.location.latitude - area.lat, 2) +
                    Math.pow(this.location.longitude - area.lon, 2)
            );
            return distance < area.radius;
        });
    }

    /**
     * Helper: Check if location is in urban area
     */
    private isInUrbanArea(): boolean {
        // Davao City center: ~7.07°N, 125.61°E
        const cityCenter = { lat: 7.07, lon: 125.61 };
        const distance = Math.sqrt(
            Math.pow(this.location.latitude - cityCenter.lat, 2) +
                Math.pow(this.location.longitude - cityCenter.lon, 2)
        );
        return distance < 0.05; // Within ~5km of city center
    }

    /**
     * Get the factors (must call extractFactors first)
     */
    getFactors(): GeoFactorData | null {
        return this.factors;
    }

    getLocation(): Location {
        return this.location;
    }
}
