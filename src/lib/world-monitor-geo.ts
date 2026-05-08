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
        id: "aljazeera-live",
        title: "Al Jazeera English Live",
        lat: 25.2854,
        lng: 51.5310,
        embedUrl: "https://www.youtube.com/embed/-dpyN_PzFos?autoplay=1&mute=1&controls=0&loop=1",
        thumbnail: "https://images.unsplash.com/photo-1546201382-72ab3e318cf1?w=300&h=200&fit=crop",
        country: "QA",
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
        id: "sky-news",
        title: "Sky News Global Live",
        lat: 51.5074,
        lng: -0.1278,
        embedUrl:
            "https://www.youtube.com/embed/9Auq9mYxFEE?autoplay=1&mute=1&controls=0&loop=1",
        thumbnail:
            "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=300&h=200&fit=crop",
        country: "GB",
        type: "live",
    },
    {
        id: "bloomberg-live",
        title: "Bloomberg Financial News",
        lat: 40.7128,
        lng: -74.0060,
        embedUrl:
            "https://www.youtube.com/embed/dp8PhLsUcFE?autoplay=1&mute=1&controls=0&loop=1",
        thumbnail:
            "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&h=200&fit=crop",
        country: "US",
        type: "live",
    },
    {
        id: "nasa-live",
        title: "NASA Earth Live",
        lat: 0,
        lng: 0,
        embedUrl:
            "https://www.youtube.com/embed/21X5lGlDOfg?autoplay=1&mute=1&controls=0&loop=1",
        thumbnail:
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop",
        country: "ISS",
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