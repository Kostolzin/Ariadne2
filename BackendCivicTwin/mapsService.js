// mapsService.js
// Backend-side Google Maps Platform integration.
//
// Keeps the API key hidden on the backend, normalises civic office
// types to Places search queries, and resolves typed locations via
// the Geocoding API when GPS coordinates are not provided.
//
// Exposes two pure functions:
//   - geocodeAddress(address)
//   - findNearestOffice({ officeType, location, typedLocation })

const PLACES_TEXT_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";

const GEOCODING_URL =
  "https://maps.googleapis.com/maps/api/geocode/json";

const EMBED_PLACE_URL =
  "https://www.google.com/maps/embed/v1/place";

const EMBED_DIRECTIONS_URL =
  "https://www.google.com/maps/embed/v1/directions";

const DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1";

const DISTANCE_MATRIX_URL =
  "https://maps.googleapis.com/maps/api/distancematrix/json";

// Maps the civic office types the AI / Unity layer uses to a concrete
// Places text query. Keep aliases here so callers stay declarative.
const OFFICE_TYPE_QUERIES = {
  kep: "KEP citizen service center",
  police_station: "police station",
  tax_office: "ΔΟΥ tax office",
  doy: "ΔΟΥ tax office",
  municipality: "δημαρχείο municipality",
  hospital: "hospital",
  digital_services_hub: "gov.gr digital services",
};

export class MapsConfigError extends Error {}
export class MapsRequestError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Canned data used when MAPS_MOCK=true. Keeps the demo working before
// Google Cloud billing is enabled and during offline development.
const MOCK_GEOCODE = {
  "athens center": { lat: 37.9838, lng: 23.7275, formattedAddress: "Athens, Greece" },
  athens: { lat: 37.9838, lng: 23.7275, formattedAddress: "Athens, Greece" },
  patras: { lat: 38.2466, lng: 21.7346, formattedAddress: "Patras, Greece" },
  thessaloniki: { lat: 40.6401, lng: 22.9444, formattedAddress: "Thessaloniki, Greece" },
};
const MOCK_GEOCODE_DEFAULT = MOCK_GEOCODE.athens;

const MOCK_OFFICES = {
  kep: {
    name: "KEP Syntagma",
    address: "Filellinon 9, Athens 105 57",
    lat: 37.9756,
    lng: 23.7361,
  },
  police_station: {
    name: "Syntagma Police Station",
    address: "Dragatsaniou 4, Athens 105 59",
    lat: 37.9785,
    lng: 23.7300,
  },
  tax_office: {
    name: "ΔΟΥ Α' Αθηνών",
    address: "Anaxagora 6-8, Athens 105 52",
    lat: 37.9810,
    lng: 23.7240,
  },
  doy: {
    name: "ΔΟΥ Α' Αθηνών",
    address: "Anaxagora 6-8, Athens 105 52",
    lat: 37.9810,
    lng: 23.7240,
  },
  municipality: {
    name: "Δημαρχείο Αθηνών (Athens City Hall)",
    address: "Athinas 63, Athens 105 52",
    lat: 37.9787,
    lng: 23.7253,
  },
  hospital: {
    name: "Evangelismos General Hospital",
    address: "Ipsilantou 45-47, Athens 106 76",
    lat: 37.9760,
    lng: 23.7470,
  },
  digital_services_hub: {
    name: "gov.gr Digital Services",
    address: "Online — https://gov.gr",
    lat: 37.9838,
    lng: 23.7275,
  },
};

function isMockMode() {
  return process.env.MAPS_MOCK === "true";
}

// Hardcoded "current user location" — used when the client (Unity)
// didn't pass GPS coordinates and the model didn't extract a typed
// location from the message. Lets the demo skip the geolocation /
// geocoding step while still hitting the real Places API.
function getDefaultLocation() {
  const lat = parseFloat(process.env.DEFAULT_LOCATION_LAT);
  const lng = parseFloat(process.env.DEFAULT_LOCATION_LNG);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }
  return null;
}

function getApiKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new MapsConfigError(
      "GOOGLE_MAPS_API_KEY is not set in the backend environment."
    );
  }
  return key;
}

/// <summary>
/// Public configuration the browser-side Maps JS API needs to render
/// an interactive map. The same key is returned so the frontend doesn't
/// need its own; restrict it by HTTP referrer in Google Cloud Console.
/// </summary>
export function getPublicMapsConfig() {
  const apiKey = getApiKey();
  const defaultCenter = getDefaultLocation() ?? { lat: 37.9838, lng: 23.7275 };
  return {
    apiKey,
    defaultCenter,
    mock: isMockMode(),
  };
}

/// <summary>
/// Walking distance + duration between two points via Google Distance Matrix.
/// Returns `{ distanceMeters, distanceText, durationSeconds, durationText }`
/// or null if no route was found. Mode defaults to walking; pass "driving"
/// or "transit" to override.
/// </summary>
export async function getDistance({ origin, destination, mode = "walking" } = {}) {
  if (
    !origin || typeof origin.lat !== "number" || typeof origin.lng !== "number" ||
    !destination || typeof destination.lat !== "number" || typeof destination.lng !== "number"
  ) {
    throw new MapsRequestError(
      "Both `origin` and `destination` must be { lat, lng } objects.",
      400
    );
  }

  if (isMockMode()) {
    // Rough straight-line distance (Haversine) then scale by 1.3 for street routing.
    const meters = Math.round(haversineMeters(origin, destination) * 1.3);
    const walkSeconds = Math.round(meters / 1.4); // ~1.4 m/s
    return {
      distanceMeters: meters,
      distanceText: meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`,
      durationSeconds: walkSeconds,
      durationText: formatDuration(walkSeconds),
      mock: true,
    };
  }

  const apiKey = getApiKey();
  const url =
    `${DISTANCE_MATRIX_URL}?origins=${origin.lat},${origin.lng}` +
    `&destinations=${destination.lat},${destination.lng}` +
    `&mode=${encodeURIComponent(mode)}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new MapsRequestError(
      `Distance Matrix HTTP ${response.status}`,
      response.status
    );
  }

  const data = await response.json();
  if (data.status !== "OK") {
    throw new MapsRequestError(
      `Distance Matrix error: ${data.status} ${data.error_message ?? ""}`.trim(),
      502
    );
  }

  const element = data.rows?.[0]?.elements?.[0];
  if (!element || element.status !== "OK") return null;

  return {
    distanceMeters: element.distance.value,
    distanceText: element.distance.text,
    durationSeconds: element.duration.value,
    durationText: element.duration.text,
  };
}

function haversineMeters(a, b) {
  const R = 6371_000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hours} h` : `${hours} h ${rem} min`;
}

function normaliseOfficeType(officeType) {
  if (!officeType) return null;
  return String(officeType).trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function resolveQuery(officeType) {
  const key = normaliseOfficeType(officeType);
  if (!key) return null;
  // If the caller passed a custom phrase ("nearest pharmacy"), use it as-is.
  return OFFICE_TYPE_QUERIES[key] ?? officeType;
}

/// <summary>
/// Convert a free-text address to coordinates via Google Geocoding API.
/// Returns null if no result is found.
/// </summary>
export async function geocodeAddress(address) {
  if (!address || typeof address !== "string") return null;

  if (isMockMode()) {
    const key = address.trim().toLowerCase();
    return MOCK_GEOCODE[key] ?? MOCK_GEOCODE_DEFAULT;
  }

  const apiKey = getApiKey();
  const url = `${GEOCODING_URL}?address=${encodeURIComponent(address)}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new MapsRequestError(
      `Geocoding HTTP ${response.status}`,
      response.status
    );
  }

  const data = await response.json();

  if (data.status === "ZERO_RESULTS") return null;
  if (data.status !== "OK") {
    throw new MapsRequestError(
      `Geocoding error: ${data.status} ${data.error_message ?? ""}`.trim(),
      502
    );
  }

  const top = data.results[0];
  return {
    lat: top.geometry.location.lat,
    lng: top.geometry.location.lng,
    formattedAddress: top.formatted_address,
  };
}

/// <summary>
/// Find the nearest civic office of a given type.
///
/// Accepts either explicit GPS coordinates in `location` or a free-text
/// `typedLocation` (e.g. "Athens Center"). At least one must be provided.
/// </summary>
export async function findNearestOffice({
  officeType,
  location,
  typedLocation,
} = {}) {
  const textQuery = resolveQuery(officeType);
  if (!textQuery) {
    throw new MapsRequestError("officeType is required.", 400);
  }

  let center = location;
  if (!center && typedLocation) {
    const geo = await geocodeAddress(typedLocation);
    if (!geo) return null;
    center = { lat: geo.lat, lng: geo.lng };
  }
  if (!center) {
    center = getDefaultLocation();
  }

  if (!center || typeof center.lat !== "number" || typeof center.lng !== "number") {
    throw new MapsRequestError(
      "A `location` { lat, lng }, `typedLocation` string, or DEFAULT_LOCATION_* env vars are required.",
      400
    );
  }

  if (isMockMode()) {
    const key = normaliseOfficeType(officeType);
    const office = MOCK_OFFICES[key];
    if (!office) return null;
    // Embed/directions URLs deliberately omitted in mock mode —
    // we don't have a real Place ID and may not have a working key.
    // The frontend falls back to its placeholder MiniMap.
    return {
      name: office.name,
      address: office.address,
      lat: office.lat,
      lng: office.lng,
      placeId: `mock-${key}`,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${office.lat},${office.lng}`,
      directionsUrl: `${DIRECTIONS_URL}&destination=${office.lat},${office.lng}`,
      queryUsed: textQuery,
      searchCenter: center,
      mock: true,
    };
  }

  const apiKey = getApiKey();

  const body = {
    textQuery,
    maxResultCount: 1,
    locationBias: {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius: 50000,
      },
    },
  };

  const response = await fetch(PLACES_TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new MapsRequestError(
      `Places HTTP ${response.status}: ${text}`,
      response.status
    );
  }

  const data = await response.json();
  const place = data.places?.[0];
  if (!place) return null;

  const lat = place.location?.latitude;
  const lng = place.location?.longitude;

  // Embed URL renders an interactive map inside an <iframe>.
  // The key is exposed in the iframe src by design — restrict it by HTTP
  // referrer in Google Cloud Console to limit abuse.
  const embedUrl =
    `${EMBED_PLACE_URL}?key=${encodeURIComponent(apiKey)}` +
    `&q=place_id:${encodeURIComponent(place.id)}`;

  // If we know a concrete origin (the caller passed real GPS coords, not just
  // a typed city name), generate a directions embed too. The frontend prefers
  // this over the static place embed because it shows the walking route.
  const hasGpsOrigin = Boolean(location);
  const directionsEmbedUrl = hasGpsOrigin
    ? `${EMBED_DIRECTIONS_URL}?key=${encodeURIComponent(apiKey)}` +
      `&origin=${center.lat},${center.lng}` +
      `&destination=place_id:${encodeURIComponent(place.id)}` +
      `&mode=walking`
    : undefined;

  // Directions URL opens Google Maps with the place pre-filled as destination.
  const directionsUrl =
    `${DIRECTIONS_URL}&destination=${lat},${lng}` +
    `&destination_place_id=${encodeURIComponent(place.id)}`;

  return {
    name: place.displayName?.text ?? "",
    address: place.formattedAddress ?? "",
    lat,
    lng,
    placeId: place.id,
    mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.id}`,
    embedUrl,
    directionsEmbedUrl,
    directionsUrl,
    queryUsed: textQuery,
    searchCenter: center,
  };
}
