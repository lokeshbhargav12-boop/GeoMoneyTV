const CARTO_TILE_URLS = {
  darkNoLabels: "https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png",
  darkAll: "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png",
} as const;

type CartoTileStyle = keyof typeof CARTO_TILE_URLS;

function withCartoApiKey(url: string): string {
  const apiKey = process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim();
  if (!apiKey) return url;
  if (/(?:\?|&)(?:key|api_key|apikey)=/i.test(url)) return url;

  const sep = url.includes("?") ? "&" : "?";
  const encoded = encodeURIComponent(apiKey);
  return `${url}${sep}key=${encoded}`;
}

export function getCartoTileUrl(style: CartoTileStyle): string {
  return withCartoApiKey(CARTO_TILE_URLS[style]);
}
