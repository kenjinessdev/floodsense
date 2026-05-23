export interface Landmark {
    name: string;
    lat: number;
    lng: number;
    floodTag: "historically_flooded" | "not_flooded";
}

export interface DistrictLandmarks {
    district: string;
    landmarks: Landmark[];
}

export const DISTRICT_LANDMARKS: DistrictLandmarks[] = [
    {
        district: "Agdao District",
        landmarks: [
            {
                name: "R. Castillo St, Obrero",
                lat: 7.082,
                lng: 125.618,
                floodTag: "historically_flooded",
            },
            {
                name: "Gilbert St, Obrero",
                lat: 7.088,
                lng: 125.613,
                floodTag: "not_flooded",
            },
            {
                name: "Agdao Public Market",
                lat: 7.093,
                lng: 125.627,
                floodTag: "historically_flooded",
            },
            {
                name: "Daniel R. Aguinaldo St",
                lat: 7.086,
                lng: 125.622,
                floodTag: "not_flooded",
            },
        ],
    },
    {
        district: "Baguio District",
        landmarks: [
            {
                name: "Baguio Proper (Poblacion)",
                lat: 7.170,
                lng: 125.333,
                floodTag: "not_flooded",
            },
            {
                name: "Cadalian",
                lat: 7.190,
                lng: 125.305,
                floodTag: "not_flooded",
            },
            {
                name: "Tambobong",
                lat: 7.155,
                lng: 125.355,
                floodTag: "not_flooded",
            },
        ],
    },
    {
        district: "Buhangin District",
        landmarks: [
            {
                name: "Davao International Airport",
                lat: 7.125,
                lng: 125.646,
                floodTag: "not_flooded",
            },
            {
                name: "Sasa Wharf",
                lat: 7.102,
                lng: 125.642,
                floodTag: "historically_flooded",
            },
            {
                name: "Buhangin Proper",
                lat: 7.143,
                lng: 125.592,
                floodTag: "historically_flooded",
            },
            {
                name: "Cabantian",
                lat: 7.140,
                lng: 125.610,
                floodTag: "not_flooded",
            },
        ],
    },
    {
        district: "Bunawan District",
        landmarks: [
            {
                name: "Panacan",
                lat: 7.175,
                lng: 125.628,
                floodTag: "historically_flooded",
            },
            {
                name: "Bunawan Proper",
                lat: 7.212,
                lng: 125.626,
                floodTag: "not_flooded",
            },
            {
                name: "San Isidro",
                lat: 7.230,
                lng: 125.605,
                floodTag: "not_flooded",
            },
        ],
    },
    {
        district: "Calinan District",
        landmarks: [
            {
                name: "Calinan Proper",
                lat: 7.195,
                lng: 125.450,
                floodTag: "not_flooded",
            },
            {
                name: "Sirib",
                lat: 7.222,
                lng: 125.422,
                floodTag: "not_flooded",
            },
            {
                name: "Biao",
                lat: 7.170,
                lng: 125.430,
                floodTag: "not_flooded",
            },
        ],
    },
    {
        district: "Marilog District",
        landmarks: [
            {
                name: "Marilog Proper",
                lat: 7.369,
                lng: 125.310,
                floodTag: "not_flooded",
            },
            {
                name: "Baganihan",
                lat: 7.342,
                lng: 125.278,
                floodTag: "not_flooded",
            },
            {
                name: "Salaysay",
                lat: 7.400,
                lng: 125.290,
                floodTag: "not_flooded",
            },
        ],
    },
    {
        district: "Paquibato District",
        landmarks: [
            {
                name: "Paquibato Proper",
                lat: 7.428,
                lng: 125.440,
                floodTag: "not_flooded",
            },
            {
                name: "Malabog",
                lat: 7.460,
                lng: 125.410,
                floodTag: "not_flooded",
            },
            {
                name: "Colosas",
                lat: 7.400,
                lng: 125.470,
                floodTag: "not_flooded",
            },
        ],
    },
    {
        district: "Poblacion District",
        landmarks: [
            {
                name: "Roxas Ave (near Davao River)",
                lat: 7.069,
                lng: 125.610,
                floodTag: "historically_flooded",
            },
            {
                name: "Magsaysay Park",
                lat: 7.070,
                lng: 125.615,
                floodTag: "historically_flooded",
            },
            {
                name: "San Pedro Cathedral",
                lat: 7.064,
                lng: 125.606,
                floodTag: "not_flooded",
            },
            {
                name: "Aldevinco Shopping Center",
                lat: 7.067,
                lng: 125.602,
                floodTag: "not_flooded",
            },
        ],
    },
    {
        district: "Talomo District",
        landmarks: [
            {
                name: "Matina Aplaya",
                lat: 7.050,
                lng: 125.582,
                floodTag: "historically_flooded",
            },
            {
                name: "Matina Town Square",
                lat: 7.065,
                lng: 125.565,
                floodTag: "not_flooded",
            },
            {
                name: "Ecoland (Ecoland Drive)",
                lat: 7.058,
                lng: 125.554,
                floodTag: "not_flooded",
            },
            {
                name: "Talomo Proper",
                lat: 7.060,
                lng: 125.595,
                floodTag: "historically_flooded",
            },
        ],
    },
    {
        district: "Toril District",
        landmarks: [
            {
                name: "Toril Proper",
                lat: 7.022,
                lng: 125.398,
                floodTag: "historically_flooded",
            },
            {
                name: "Daliao",
                lat: 7.000,
                lng: 125.372,
                floodTag: "not_flooded",
            },
            {
                name: "Catigan",
                lat: 7.040,
                lng: 125.350,
                floodTag: "not_flooded",
            },
        ],
    },
    {
        district: "Tugbok District",
        landmarks: [
            {
                name: "Tugbok Proper",
                lat: 7.132,
                lng: 125.455,
                floodTag: "not_flooded",
            },
            {
                name: "Catalunan Grande",
                lat: 7.115,
                lng: 125.472,
                floodTag: "not_flooded",
            },
            {
                name: "New Matina",
                lat: 7.100,
                lng: 125.540,
                floodTag: "historically_flooded",
            },
        ],
    },
];
