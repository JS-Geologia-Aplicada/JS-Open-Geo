import { useEffect, useRef } from "react";
import type { PointCoords } from "../utils/mapUtils";
import L from "leaflet";

interface LeafletMapProps {
  points: PointCoords[];
}

const LeafletMap = ({ points }: LeafletMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Inicializando o Mapa
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        [-6.5, -49.8],
        10
      );

      // Adicionar camada base (OpenStreetMap)
      const osmLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }
      );

      const esriSatelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA",
          maxZoom: 18,
        }
      );

      osmLayer.addTo(mapRef.current);
      esriSatelliteLayer.addTo(mapRef.current);

      // Controle de camadas
      const baseLayers = {
        Mapa: osmLayer,
        Satélite: esriSatelliteLayer,
      };

      L.control.layers(baseLayers).addTo(mapRef.current);

      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    // Limpar marcadores existentes
    markersLayerRef.current.clearLayers();

    const validMarkers: L.LatLng[] = [];

    // Adicionar novos marcadores
    points.forEach((point) => {
      const lat = point.coords[1];
      const lon = point.coords[0];
      if (
        lat !== 0 &&
        lon !== 0 &&
        Number.isFinite(lat) &&
        Number.isFinite(lon)
      ) {
        const latLng = L.latLng(lat, lon);
        const marker = L.marker([lat, lon]).bindPopup(
          `<b>${point.id}</b><br>Lat: ${lat}<br>Lon: ${lon}`
        );

        markersLayerRef.current!.addLayer(marker);
        validMarkers.push(latLng);
      }
    });

    // Ajustar zoom para mostrar todos os pontos
    if (validMarkers.length > 0) {
      try {
        if (validMarkers.length === 1) {
          // Se só tem 1 ponto, só centralize
          mapRef.current.setView(validMarkers[0], 15);
        } else {
          // Se tem múltiplos pontos, use fitBounds com padding menor
          const bounds = L.latLngBounds(validMarkers);
          mapRef.current.fitBounds(bounds);
        }
      } catch (error) {
        // Fallback: centralizar no primeiro ponto
        mapRef.current.setView(validMarkers[0], 12);
      }
    }
  }, [points]); // Roda sempre que points mudar

  return (
    <>
      <div>
        LeafletMap
        <div
          ref={mapContainerRef}
          style={{ height: "50vh", width: "100%", border: "1px solid #ccc" }}
        />
      </div>
    </>
  );
};

export default LeafletMap;
