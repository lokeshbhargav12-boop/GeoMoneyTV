export interface Webcam {
    id: string;
    title: string;
    lat: number;
    lng: number;
    embedUrl: string;
    thumbnail: string;
    country: string;
    type: "live" | "stream" | "streetview";
}

export const LIVE_WEBCAMS: Webcam[] = [
    {
        id: "nyc-ts",
        title: "Times Square, NYC",
        lat: 40.758,
        lng: -73.9855,
        embedUrl:
            "https://www.youtube.com/embed/AdUw5RdyZxI?autoplay=1&mute=1&controls=0&loop=1",
        thumbnail:
            "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=300&h=200&fit=crop",
        country: "US",
        type: "live",
    },
    {
        id: "tokyo-shibuya",
        title: "Shibuya Crossing, Tokyo",
        lat: 35.6595,
        lng: 139.7004,
        embedUrl:
            "https://www.youtube.com/embed/DjdUEyjx8GM?autoplay=1&mute=1&controls=0&loop=1",
        thumbnail:
            "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=300&h=200&fit=crop",
        country: "JP",
        type: "live",
    },
    {
        id: "miami-beach",
        title: "Miami Beach, Florida",
        lat: 25.7907,
        lng: -80.13,
        embedUrl:
            "https://www.youtube.com/embed/aRBC3xjQHE4?autoplay=1&mute=1&controls=0&loop=1",
        thumbnail:
            "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=300&h=200&fit=crop",
        country: "US",
        type: "live",
    },
    {
        id: "jackson-hole",
        title: "Jackson Hole Town Square",
        lat: 43.4799,
        lng: -110.7624,
        embedUrl:
            "https://www.youtube.com/embed/DoMqMGHm1gY?autoplay=1&mute=1&controls=0&loop=1",
        thumbnail:
            "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=300&h=200&fit=crop",
        country: "US",
        type: "live",
    },
    {
        id: "iss-live",
        title: "ISS - Earth from Space",
        lat: 0,
        lng: 0,
        embedUrl:
            "https://www.youtube.com/embed/P9C25Un7xaM?autoplay=1&mute=1&controls=0&loop=1",
        thumbnail:
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop",
        country: "ISS",
        type: "live",
    },
    {
        id: "london-eye",
        title: "London Eye, UK",
        lat: 51.5033,
        lng: -0.1196,
        embedUrl:
            "https://www.youtube.com/embed/FrZ3ZkpjKXE?autoplay=1&mute=1&controls=0&loop=1",
        thumbnail:
            "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=300&h=200&fit=crop",
        country: "UK",
        type: "live",
    },
    {
        id: "dubai-live",
        title: "Dubai Skyline Live",
        lat: 25.1972,
        lng: 55.2744,
        embedUrl:
            "https://www.youtube.com/embed/JY8u-cf8Rnk?autoplay=1&mute=1&controls=0&loop=1",
        thumbnail:
            "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=300&h=200&fit=crop",
        country: "AE",
        type: "live",
    },
    {
        id: "rome-trevi",
        title: "Trevi Fountain, Rome",
        lat: 41.9009,
        lng: 12.4833,
        embedUrl:
            "https://www.youtube.com/embed/Sknp56aERFI?autoplay=1&mute=1&controls=0&loop=1",
        thumbnail:
            "https://images.unsplash.com/photo-1529260830199-42c24126f198?w=300&h=200&fit=crop",
        country: "IT",
        type: "live",
    },
    {
        id: "singapore-marina",
        title: "Marina Bay, Singapore",
        lat: 1.2816,
        lng: 103.8636,
        embedUrl:
            "https://www.youtube.com/embed/Gti3fMsEPKI?autoplay=1&mute=1&controls=0&loop=1",
        thumbnail:
            "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=300&h=200&fit=crop",
        country: "SG",
        type: "live",
    },
    {
        id: "istanbul-bosphorus",
        title: "Bosphorus, Istanbul",
        lat: 41.0422,
        lng: 29.0083,
        embedUrl:
            "https://www.youtube.com/embed/m3DXqPxdPC8?autoplay=1&mute=1&controls=0&loop=1",
        thumbnail:
            "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=300&h=200&fit=crop",
        country: "TR",
        type: "live",
    },
    {
        id: "sydney-harbour",
        title: "Sydney Harbour",
        lat: -33.8568,
        lng: 151.2153,
        embedUrl:
            "https://www.youtube.com/embed/nXiOy0i6TsQ?autoplay=1&mute=1&controls=0&loop=1",
        thumbnail:
            "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=300&h=200&fit=crop",
        country: "AU",
        type: "live",
    },
    {
        id: "nairobi-live",
        title: "Nairobi City, Kenya",
        lat: -1.2921,
        lng: 36.8219,
        embedUrl:
            "https://www.youtube.com/embed/N1Efx1t0JBo?autoplay=1&mute=1&controls=0&loop=1",
        thumbnail:
            "https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=300&h=200&fit=crop",
        country: "KE",
        type: "live",
    },
];

export const STREETVIEW_LOCATIONS = [
    { label: "Pentagon", lat: 38.871, lng: -77.056, heading: 120 },
    { label: "Kremlin", lat: 55.752, lng: 37.617, heading: 220 },
    { label: "Tiananmen", lat: 39.908, lng: 116.397, heading: 0 },
    { label: "DMZ Korea", lat: 37.956, lng: 126.678, heading: 0 },
    { label: "Suez Canal", lat: 30.458, lng: 32.349, heading: 90 },
    { label: "Strait of Hormuz", lat: 26.595, lng: 56.248, heading: 180 },
    { label: "Gaza Border", lat: 31.332, lng: 34.375, heading: 0 },
    { label: "Chernobyl", lat: 51.389, lng: 30.098, heading: 0 },
    { label: "White House", lat: 38.8977, lng: -77.0365, heading: 180 },
    { label: "UN HQ NYC", lat: 40.749, lng: -73.968, heading: 270 },
    { label: "NATO Brussels", lat: 50.876, lng: 4.425, heading: 90 },
    { label: "Downing St", lat: 51.503, lng: -0.127, heading: 0 },
];

export function getStreetViewEmbedUrl(
    lat: number,
    lng: number,
    heading = 0,
    pitch = 0,
): string {
    return `https://www.google.com/maps/embed?pb=!4v${Date.now()}!6m8!1m7!1s!2m2!1d${lat}!2d${lng}!3f${heading}!4f${pitch}!5f0.75`;
}

export function getStreetViewDirectUrl(
    lat: number,
    lng: number,
    heading = 0,
    pitch = 0,
    fov = 90,
): string {
    return `https://www.google.com/maps/@${lat},${lng},3a,${fov}y,${heading}h,${90 + pitch}t/data=!3m1!1e1`;
}

function toRadians(value: number): number {
    return (value * Math.PI) / 180;
}

export function getDistanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
): number {
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}

export function getNearbyWebcams(lat: number, lng: number, limit = 4) {
    return LIVE_WEBCAMS.filter((camera) => camera.country !== "ISS")
        .map((camera) => ({
            ...camera,
            distanceKm: getDistanceKm(lat, lng, camera.lat, camera.lng),
        }))
        .sort((left, right) => left.distanceKm - right.distanceKm)
        .slice(0, limit);
}