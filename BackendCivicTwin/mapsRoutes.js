// mapsRoutes.js
// Express routes for Google Maps lookups.
//
// Unity (or the AI orchestrator) calls these instead of talking to
// Google directly, so the API key stays on the backend.

import express from "express";

import {
  findNearestOffice,
  geocodeAddress,
  getDistance,
  getPublicMapsConfig,
  MapsConfigError,
  MapsRequestError,
} from "./mapsService.js";

export const mapsRouter = express.Router();

function handleMapsError(error, res) {
  console.error("Maps error:", error);

  if (error instanceof MapsConfigError) {
    return res.status(500).json({
      success: false,
      assistantMessage: "Map services are not configured on the server.",
    });
  }

  if (error instanceof MapsRequestError) {
    const status = error.status >= 400 && error.status < 600 ? error.status : 502;
    return res.status(status).json({
      success: false,
      assistantMessage: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    assistantMessage: "Unexpected map services error.",
  });
}

/// <summary>
/// Find the nearest civic office of a given type.
///
/// Body:
///   officeType:   "KEP" | "police_station" | "tax_office" | "municipality" | "hospital" | string
///   location:     { lat, lng }     (optional if typedLocation is provided)
///   typedLocation: "Athens Center" (optional if location is provided)
/// </summary>
mapsRouter.post("/nearest", async (req, res) => {
  try {
    const { officeType, location, typedLocation } = req.body ?? {};

    const result = await findNearestOffice({
      officeType,
      location,
      typedLocation,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        assistantMessage: "No matching office was found near that location.",
      });
    }

    return res.json({
      success: true,
      assistantMessage: `Nearest ${officeType}: ${result.name}.`,
      result,
    });
  } catch (error) {
    return handleMapsError(error, res);
  }
});

/// <summary>
/// Public maps config for the browser-side Maps JS API.
/// Returns the API key (must be referrer-restricted in GCP) plus a default
/// center for the initial viewport.
/// </summary>
mapsRouter.get("/config", (_req, res) => {
  try {
    return res.json({ success: true, ...getPublicMapsConfig() });
  } catch (error) {
    return handleMapsError(error, res);
  }
});

/// <summary>
/// Walking distance + duration between two points.
///
/// Body:
///   origin:      { lat, lng }
///   destination: { lat, lng }
///   mode:        "walking" | "driving" | "transit"  (default "walking")
/// </summary>
mapsRouter.post("/distance", async (req, res) => {
  try {
    const { origin, destination, mode } = req.body ?? {};
    const result = await getDistance({ origin, destination, mode });
    if (!result) {
      return res.status(404).json({
        success: false,
        assistantMessage: "No route was found between those points.",
      });
    }
    return res.json({ success: true, result });
  } catch (error) {
    return handleMapsError(error, res);
  }
});

/// <summary>
/// Convert a free-text address to coordinates.
///
/// Body:
///   address: "Patras" | "Syntagma Square, Athens" | ...
/// </summary>
mapsRouter.post("/geocode", async (req, res) => {
  try {
    const { address } = req.body ?? {};

    if (!address) {
      return res.status(400).json({
        success: false,
        assistantMessage: "`address` is required.",
      });
    }

    const result = await geocodeAddress(address);

    if (!result) {
      return res.status(404).json({
        success: false,
        assistantMessage: "Could not resolve that address.",
      });
    }

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    return handleMapsError(error, res);
  }
});
