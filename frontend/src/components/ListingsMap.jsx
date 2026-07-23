import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/**
 * Interactive map of listings that have lat/lng.
 */
export default function ListingsMap({ listings }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) {
      return undefined;
    }
    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      keyboard: true,
    }).setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapInstance.current = map;
    return () => {
      map.remove();
      mapInstance.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    const layer = layerRef.current;
    if (!map || !layer) {
      return;
    }
    layer.clearLayers();
    const bounds = [];
    (listings || []).forEach((listing) => {
      const lat = Number(listing.lat);
      const lng = Number(listing.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return;
      }
      const id = listing._id || listing.id;
      const marker = L.marker([lat, lng], { icon: defaultIcon });
      marker.bindPopup(
        `<strong>${listing.title || 'Property'}</strong><br/>$${Number(listing.price || 0).toLocaleString()}`
      );
      marker.on('click', () => {
        if (id) {
          navigate(`/property/${id}`);
        }
      });
      marker.addTo(layer);
      bounds.push([lat, lng]);
    });
    if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [listings, navigate]);

  const hasPins = (listings || []).some(
    (l) => Number.isFinite(Number(l.lat)) && Number.isFinite(Number(l.lng))
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700">
      <div ref={mapRef} className="h-80 w-full" role="application" aria-label="Property map" />
      {!hasPins ? (
        <p className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          No listings have map coordinates yet. Add lat/lng when creating a property to show pins.
        </p>
      ) : null}
    </div>
  );
}
