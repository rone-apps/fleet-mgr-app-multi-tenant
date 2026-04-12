import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-cluster";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";

// ─── Helper: color tier by count ────────────────────────────────────────────
function clusterColor(count) {
  if (count >= 50) return { bg: "#e53935", border: "#b71c1c" }; // red
  if (count >= 10) return { bg: "#fb8c00", border: "#e65100" }; // orange
  return { bg: "#1e88e5", border: "#0d47a1" };                   // blue
}

function clusterSize(count) {
  if (count >= 50) return 52;
  if (count >= 10) return 42;
  return 34;
}

// ─── Custom cluster icon factory ────────────────────────────────────────────
function createClusterIcon(cluster) {
  const count = cluster.getChildCount();
  const { bg, border } = clusterColor(count);
  const size = clusterSize(count);

  return L.divIcon({
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background:${bg};
        border:3px solid ${border};
        display:flex;
        align-items:center;
        justify-content:center;
        color:#fff;
        font-weight:700;
        font-size:${size < 40 ? 11 : 13}px;
        font-family:sans-serif;
        box-shadow:0 2px 6px rgba(0,0,0,0.35);
      ">${count}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ─── Individual taxi cab marker icon ────────────────────────────────────────
function createCabIcon(count) {
  return L.divIcon({
    html: `
      <div style="
        background:#1565c0;
        border:2px solid #0d47a1;
        border-radius:8px;
        padding:3px 6px;
        display:inline-flex;
        align-items:center;
        gap:3px;
        color:#fff;
        font-size:11px;
        font-weight:600;
        font-family:sans-serif;
        box-shadow:0 2px 5px rgba(0,0,0,0.4);
        white-space:nowrap;
      ">
        <span style="font-size:14px;line-height:1;">🚕</span>
        <span>${count}</span>
      </div>`,
    className: "",
    iconSize: null,
    iconAnchor: [20, 14],
  });
}

// ─── Legend control (rendered into map DOM via Leaflet control API) ──────────
function MapLegend() {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: "bottomright" });

    legend.onAdd = () => {
      const div = L.DomUtil.create("div");
      div.innerHTML = `
        <div style="
          background:rgba(255,255,255,0.93);
          border:1px solid #ccc;
          border-radius:8px;
          padding:10px 14px;
          font-family:sans-serif;
          font-size:12px;
          line-height:1.7;
          min-width:175px;
          box-shadow:0 2px 6px rgba(0,0,0,0.2);
        ">
          <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:#1a1a1a;">MacLure's Pickup Locations</div>

          <div style="font-weight:600;color:#555;margin-bottom:4px;">Cluster density</div>

          <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
            <div style="width:14px;height:14px;border-radius:50%;background:#1e88e5;border:2px solid #0d47a1;flex-shrink:0;"></div>
            <span>&lt; 10 trips</span>
          </div>

          <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
            <div style="width:18px;height:18px;border-radius:50%;background:#fb8c00;border:2px solid #e65100;flex-shrink:0;"></div>
            <span>10 – 49 trips</span>
          </div>

          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="width:22px;height:22px;border-radius:50%;background:#e53935;border:2px solid #b71c1c;flex-shrink:0;"></div>
            <span>50+ trips</span>
          </div>

          <div style="border-top:1px solid #eee;padding-top:6px;display:flex;align-items:center;gap:6px;">
            <span style="font-size:16px;">🚕</span>
            <span>Pickup location</span>
          </div>
        </div>`;

      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);
      return div;
    };

    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
}

// ─── Main exported component ─────────────────────────────────────────────────
export default function MapComponent({ points }) {
  const center = [49.2827, -123.1207];
  const zoom = 12;

  return (
    <MapContainer center={center} zoom={zoom} style={{ width: "100%", height: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      <MarkerClusterGroup
        iconCreateFunction={createClusterIcon}
        chunkedLoading
        maxClusterRadius={60}
        showCoverageOnHover={false}
        spiderfyOnMaxZoom={true}
      >
        {points.map((pt, i) => (
          <Marker
            key={i}
            position={[pt.lat, pt.lng]}
            icon={createCabIcon(pt.count)}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <span style={{ fontFamily: "sans-serif", fontSize: "12px" }}>
                <strong>{pt.address}</strong><br />
                {pt.count} {pt.count === 1 ? "trip" : "trips"}
              </span>
            </Tooltip>
          </Marker>
        ))}
      </MarkerClusterGroup>

      <MapLegend />
    </MapContainer>
  );
}
