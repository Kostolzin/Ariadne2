import { useEffect, useMemo, useRef, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import { fetchDistance, fetchMapsConfig } from "../api/client";
import type {
  DistanceResult,
  MapsConfigResponse,
  NearestOfficeResult,
} from "../types/api";
import type { UserLocation } from "../api/geolocation";
import { Icon } from "./Icon";
import { SectionLabel } from "./SectionLabel";

interface MapCardProps {
  nearestOffice: NearestOfficeResult | null;
  userLocation: UserLocation | null;
  isLocating: boolean;
  locationError: string | null;
  onShareLocation: () => void;
}

const FALLBACK_CENTER = { lat: 37.9838, lng: 23.7275 };

export function MapCard(props: MapCardProps) {
  const [config, setConfig] = useState<MapsConfigResponse | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    fetchMapsConfig()
      .then(setConfig)
      .catch((error) => setConfigError(error.message ?? "Map config error"));
  }, []);

  if (configError || (config && !config.apiKey)) {
    return (
      <MapShell title={props.nearestOffice?.name ?? "City map"}>
        <MapPlaceholder
          message={
            configError ??
            "Maps are not configured on the backend. Set GOOGLE_MAPS_API_KEY in CivicTwinBackend/.env."
          }
        />
        <CardFooter {...props} distance={null} />
      </MapShell>
    );
  }

  if (!config) {
    return (
      <MapShell title="Loading map…">
        <MapPlaceholder message="Loading…" />
      </MapShell>
    );
  }

  return (
    <APIProvider apiKey={config.apiKey}>
      <LiveMapCard {...props} defaultCenter={config.defaultCenter} />
    </APIProvider>
  );
}

interface LiveMapCardProps extends MapCardProps {
  defaultCenter: { lat: number; lng: number };
}

function LiveMapCard({ defaultCenter, ...props }: LiveMapCardProps) {
  const { nearestOffice, userLocation } = props;
  const [distance, setDistance] = useState<DistanceResult | null>(null);

  useEffect(() => {
    if (!userLocation || !nearestOffice) {
      setDistance(null);
      return;
    }
    let cancelled = false;
    fetchDistance({
      origin: userLocation,
      destination: { lat: nearestOffice.lat, lng: nearestOffice.lng },
      mode: "walking",
    })
      .then((response) => {
        if (!cancelled) setDistance(response.result);
      })
      .catch(() => {
        if (!cancelled) setDistance(null);
      });
    return () => {
      cancelled = true;
    };
  }, [
    userLocation?.lat,
    userLocation?.lng,
    nearestOffice?.lat,
    nearestOffice?.lng,
    // We re-run when either endpoint changes; including the objects directly would loop.
  ]);

  const initialCenter = useMemo(() => {
    if (nearestOffice) return { lat: nearestOffice.lat, lng: nearestOffice.lng };
    if (userLocation) return userLocation;
    return defaultCenter ?? FALLBACK_CENTER;
  }, [defaultCenter, nearestOffice, userLocation]);

  return (
    <MapShell title={nearestOffice?.name ?? "City map"} address={nearestOffice?.address}>
      <div style={{ position: "relative", height: 300 }}>
        <Map
          mapId="ariadne-civic"
          defaultCenter={initialCenter}
          defaultZoom={nearestOffice ? 15 : 13}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: "100%", height: "100%" }}
        >
          {userLocation && (
            <AdvancedMarker position={userLocation} title="Your location">
              <Pin background="#1f5d4a" borderColor="#0e2024" glyphColor="#fbf7ee" />
            </AdvancedMarker>
          )}
          {nearestOffice && (
            <AdvancedMarker
              position={{ lat: nearestOffice.lat, lng: nearestOffice.lng }}
              title={nearestOffice.name}
            >
              <Pin background="#c87a6a" borderColor="#0e2024" glyphColor="#fbf7ee" />
            </AdvancedMarker>
          )}
          <AutoFitBounds
            userLocation={userLocation}
            office={nearestOffice}
          />
        </Map>
      </div>
      <CardFooter {...props} distance={distance} />
    </MapShell>
  );
}

interface AutoFitBoundsProps {
  userLocation: UserLocation | null;
  office: NearestOfficeResult | null;
}

function AutoFitBounds({ userLocation, office }: AutoFitBoundsProps) {
  const map = useMap();
  const lastFitKey = useRef<string | null>(null);

  useEffect(() => {
    if (!map) return;
    if (!userLocation || !office) return;

    const key = `${userLocation.lat},${userLocation.lng}|${office.lat},${office.lng}`;
    if (lastFitKey.current === key) return;
    lastFitKey.current = key;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(userLocation);
    bounds.extend({ lat: office.lat, lng: office.lng });
    map.fitBounds(bounds, 80);
  }, [map, userLocation, office]);

  return null;
}

interface MapShellProps {
  title: string;
  address?: string;
  children: React.ReactNode;
}

function MapShell({ title, address, children }: MapShellProps) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(31,93,74,0.2)",
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "14px 16px 10px" }}>
        <SectionLabel small>Where you're going</SectionLabel>
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 19,
            fontWeight: 500,
            letterSpacing: -0.3,
            marginTop: 6,
          }}
        >
          {title}
        </div>
        {address && (
          <div style={{ fontSize: 12.5, color: "#6a6f78", marginTop: 2 }}>{address}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function MapPlaceholder({ message }: { message: string }) {
  return (
    <div
      style={{
        height: 300,
        background:
          "repeating-linear-gradient(45deg, #eee5d2 0 12px, #e2d8c2 12px 24px)",
        display: "grid",
        placeItems: "center",
        color: "#6a4a30",
        fontSize: 13,
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      {message}
    </div>
  );
}

interface CardFooterProps extends MapCardProps {
  distance: DistanceResult | null;
}

function CardFooter({
  nearestOffice,
  userLocation,
  isLocating,
  locationError,
  onShareLocation,
  distance,
}: CardFooterProps) {
  return (
    <div
      style={{
        padding: "12px 16px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        borderTop: "1px solid rgba(31,93,74,0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
          fontSize: 13,
          color: "#0e2024",
        }}
      >
        {distance ? (
          <>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="walk" size={14} /> <strong>{distance.durationText}</strong> walk
            </span>
            <span style={{ color: "#6a6f78" }}>·</span>
            <span style={{ color: "#6a6f78" }}>{distance.distanceText}</span>
          </>
        ) : userLocation && nearestOffice ? (
          <span style={{ color: "#6a6f78" }}>Calculating distance…</span>
        ) : nearestOffice ? (
          <span style={{ color: "#6a6f78" }}>
            Share your location to see distance and walking time.
          </span>
        ) : (
          <span style={{ color: "#6a6f78" }}>
            Tell Ariadne what's happened — a destination will appear here.
          </span>
        )}
      </div>

      {locationError && (
        <div style={{ fontSize: 11.5, color: "#c87a6a" }}>{locationError}</div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {!userLocation && (
          <button
            onClick={onShareLocation}
            disabled={isLocating}
            style={{
              ...btnSecondary,
              cursor: isLocating ? "wait" : "pointer",
              opacity: isLocating ? 0.6 : 1,
            }}
          >
            <Icon name="pin" size={14} />
            {isLocating ? "Locating…" : "Use my location"}
          </button>
        )}
        {nearestOffice && (
          <>
            <a
              href={nearestOffice.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={btnSecondary}
            >
              Open in Maps
            </a>
            <a
              href={nearestOffice.directionsUrl ?? nearestOffice.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={btnPrimary}
            >
              <Icon name="walk" size={14} /> Walking directions
            </a>
          </>
        )}
      </div>
    </div>
  );
}

const btnPrimary = {
  background: "#1f5d4a",
  color: "#fbf7ee",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 12.5,
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "none",
} as const;

const btnSecondary = {
  background: "transparent",
  color: "#1f5d4a",
  border: "1px solid rgba(31,93,74,0.35)",
  borderRadius: 8,
  padding: "7px 11px",
  fontSize: 12.5,
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
} as const;
