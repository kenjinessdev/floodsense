// UTM Zone 51N (EPSG:32651) to WGS84 converter for Davao City
const WGS84_A = 6378137;
const WGS84_ECC_SQ = 0.00669438;
const K0 = 0.9996;
const FALSE_EASTING = 500000;

export function utmToWgs84(
    easting: number,
    northing: number
): [number, number] {
    const e1 =
        (1 - Math.sqrt(1 - WGS84_ECC_SQ)) / (1 + Math.sqrt(1 - WGS84_ECC_SQ));
    const x = easting - FALSE_EASTING;
    const y = northing;

    const m = y / K0;
    const mu =
        m /
        (WGS84_A *
            (1 -
                WGS84_ECC_SQ / 4 -
                (3 * WGS84_ECC_SQ ** 2) / 64 -
                (5 * WGS84_ECC_SQ ** 3) / 256));

    const phi1Rad =
        mu +
        ((3 * e1) / 2) * (1 - (3 * e1 ** 2) / 8) * Math.sin(2 * mu) +
        ((15 * e1 ** 2) / 16) * (1 - e1 ** 2 / 4) * Math.sin(4 * mu) +
        ((35 * e1 ** 3) / 48) * Math.sin(6 * mu);

    const n1 = WGS84_A / Math.sqrt(1 - WGS84_ECC_SQ * Math.sin(phi1Rad) ** 2);
    const t1 = Math.tan(phi1Rad) ** 2;
    const c1 = (WGS84_ECC_SQ / (1 - WGS84_ECC_SQ)) * Math.cos(phi1Rad) ** 2;
    const r1 =
        (WGS84_A * (1 - WGS84_ECC_SQ)) /
        (1 - WGS84_ECC_SQ * Math.sin(phi1Rad) ** 2) ** 1.5;
    const d = x / (n1 * K0);

    const lat =
        phi1Rad -
        ((n1 * Math.tan(phi1Rad)) / r1) *
            (d ** 2 / 2 -
                ((5 +
                    3 * t1 +
                    10 * c1 -
                    4 * c1 ** 2 -
                    9 * (WGS84_ECC_SQ / (1 - WGS84_ECC_SQ))) *
                    d ** 4) /
                    24 +
                ((61 +
                    90 * t1 +
                    298 * c1 +
                    45 * t1 ** 2 -
                    252 * (WGS84_ECC_SQ / (1 - WGS84_ECC_SQ)) -
                    3 * (WGS84_ECC_SQ / (1 - WGS84_ECC_SQ)) ** 2) *
                    d ** 6) /
                    720);

    const lng =
        (d -
            ((1 + 2 * t1 + c1) * d ** 3) / 6 +
            ((5 -
                2 * c1 +
                28 * t1 -
                3 * c1 ** 2 +
                8 * (WGS84_ECC_SQ / (1 - WGS84_ECC_SQ)) +
                24 * t1 ** 2) *
                d ** 5) /
                120) /
        Math.cos(phi1Rad);

    const lngOrigin = (51 - 1) * 6 - 180 + 3;

    return [(lat * 180) / Math.PI, lngOrigin + (lng * 180) / Math.PI];
}
