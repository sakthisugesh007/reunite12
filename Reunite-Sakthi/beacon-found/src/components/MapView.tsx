interface MapViewProps {
  center: [number, number];
  marker?: [number, number];
  zoom?: number;
  onLocationSelect?: (coords: [number, number]) => void;
}

function getBounds([latitude, longitude]: [number, number], delta: number) {
  const left = longitude - delta;
  const right = longitude + delta;
  const top = latitude + delta;
  const bottom = latitude - delta;

  return `${left},${bottom},${right},${top}`;
}

export function MapView({ center, marker, zoom = 15 }: MapViewProps) {
  const mapPoint = marker || center;
  const delta = zoom >= 15 ? 0.005 : zoom >= 13 ? 0.01 : 0.02;
  const bounds = getBounds(mapPoint, delta);
  const iframeUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bounds)}&layer=mapnik&marker=${encodeURIComponent(`${mapPoint[0]},${mapPoint[1]}`)}`;

  return (
    <iframe
      title="Live location map"
      src={iframeUrl}
      className="h-full w-full border-0"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
