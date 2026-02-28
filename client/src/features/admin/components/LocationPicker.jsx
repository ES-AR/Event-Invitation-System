import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useGeocodeSearch } from "../../../hooks/useGeocodeSearch";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [6.5244, 3.3792];

const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
};

const isValidCoord = (value) => typeof value === "number" && !Number.isNaN(value);

export default function LocationPicker({ token, value = {}, onChange }) {
  const [inputValue, setInputValue] = useState(value.label || "");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setInputValue(value.label || "");
  }, [value.label]);

  const searchQuery = inputValue.trim().length >= 3 ? inputValue : "";
  const { results, isLoading, status, error } = useGeocodeSearch(searchQuery, token);

  const hasCoordinates = isValidCoord(value.latitude) && isValidCoord(value.longitude);
  const mapCenter = useMemo(() => {
    if (hasCoordinates) {
      return [value.latitude, value.longitude];
    }
    return DEFAULT_CENTER;
  }, [hasCoordinates, value.latitude, value.longitude]);

  const handleManualChange = (nextValue) => {
    setInputValue(nextValue);
    setShowResults(true);
    onChange?.({
      label: nextValue,
      latitude: null,
      longitude: null,
    });
  };

  const handleResultClick = (result) => {
    setInputValue(result.label);
    setShowResults(false);
    onChange?.({
      label: result.label,
      latitude: result.latitude,
      longitude: result.longitude,
    });
  };

  const handleClear = () => {
    setInputValue("");
    setShowResults(false);
    onChange?.({ label: "", latitude: null, longitude: null });
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-700">Event location</label>
      <div className="space-y-2">
        <input
          value={inputValue}
          onChange={(event) => handleManualChange(event.target.value)}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
          placeholder="Search an address or venue"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-primary-400 focus:outline-none"
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {searchQuery
              ? isLoading
                ? "Searching..."
                : status === "error"
                  ? error?.message || "Location lookup failed"
                  : results.length
                    ? "Select a result to pin it on the map"
                    : "No results yet"
              : "Type at least 3 characters to search"}
          </span>
          {inputValue && (
            <button type="button" className="font-semibold text-primary-600" onClick={handleClear}>
              Clear
            </button>
          )}
        </div>
        {showResults && !isLoading && results.length > 0 && (
          <ul className="max-h-60 divide-y overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
            {results.map((result) => (
              <li
                key={result.id}
                className="cursor-pointer px-4 py-3 text-sm hover:bg-slate-50"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleResultClick(result)}
              >
                {result.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`rounded-2xl border ${hasCoordinates ? "border-slate-200" : "border-dashed border-slate-300"}`}>
        {hasCoordinates ? (
          <MapContainer
            center={mapCenter}
            zoom={15}
            className="h-72 w-full rounded-2xl"
            scrollWheelZoom={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[value.latitude, value.longitude]}>
              <Popup>{value.label || "Selected location"}</Popup>
            </Marker>
            <RecenterMap center={mapCenter} />
          </MapContainer>
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-slate-500">
            Search and select an address to preview it.
          </div>
        )}
      </div>
    </div>
  );
}
