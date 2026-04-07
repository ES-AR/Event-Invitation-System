import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const isValidCoord = (value) => typeof value === "number" && !Number.isNaN(value);

export default function EventLocationMap({ title, address, latitude, longitude }) {
  if (!isValidCoord(latitude) || !isValidCoord(longitude)) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-slate-400">
        <span>Map preview</span>
      </div>
      <p className="text-sm text-slate-600">{address}</p>
      <div className="h-80 overflow-hidden rounded-[32px] border border-slate-200">
        <MapContainer
          key={`${latitude}-${longitude}`}
          center={[latitude, longitude]}
          zoom={15}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[latitude, longitude]}>
            <Popup>
              <strong>{title}</strong>
              <br />
              {address}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
