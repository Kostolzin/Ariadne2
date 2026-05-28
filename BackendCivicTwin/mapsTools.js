// mapsTools.js
// Gemini function-calling adapter for the maps service.
//
// Declares the maps tools the model can call and dispatches calls
// back to mapsService. The model never sees the Google API key.

import { Type } from "@google/genai";

import {
  findNearestOffice,
  geocodeAddress,
  MapsConfigError,
  MapsRequestError,
} from "./mapsService.js";

export const mapsToolDeclarations = [
  {
    name: "findNearestOffice",
    description:
      "Find the nearest Greek civic office of a given type (KEP, police station, tax office, municipality, hospital, etc.). " +
      "Use this whenever the user asks where to find or how to get to such an office. " +
      "If GPS coordinates were provided by the client they are used automatically; otherwise pass `typedLocation`.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        officeType: {
          type: Type.STRING,
          description:
            'One of: "KEP", "police_station", "tax_office", "municipality", "hospital", "digital_services_hub". ' +
            "For other office types, pass a free-text phrase like 'pharmacy'.",
        },
        typedLocation: {
          type: Type.STRING,
          description:
            "Free-text location to search near, e.g. 'Athens Center', 'Patras'. " +
            "Required when the client has not supplied GPS coordinates.",
        },
      },
      required: ["officeType"],
    },
  },
  {
    name: "geocodeAddress",
    description:
      "Convert a free-text address or place name into latitude/longitude coordinates. " +
      "Use this only when you need coordinates for a place but do not need to find a nearby office.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        address: {
          type: Type.STRING,
          description: "Free-text address, e.g. 'Syntagma Square, Athens'.",
        },
      },
      required: ["address"],
    },
  },
];

/// <summary>
/// Execute a Gemini function call against the maps service.
///
/// Returns a plain JSON-serialisable object the model can read in its
/// next turn. Tool errors are returned as `{ error }` rather than thrown
/// so the model can recover (e.g. ask the user for a location).
/// </summary>
export async function executeMapsTool(call, user) {
  const args = call.args ?? {};

  try {
    if (call.name === "findNearestOffice") {
      const result = await findNearestOffice({
        officeType: args.officeType,
        typedLocation: args.typedLocation ?? user?.typedLocation,
        location: user?.location,
      });
      return result ?? { error: "No matching office was found." };
    }

    if (call.name === "geocodeAddress") {
      const result = await geocodeAddress(args.address);
      return result ?? { error: "Could not resolve that address." };
    }

    return { error: `Unknown tool: ${call.name}` };
  } catch (error) {
    if (error instanceof MapsConfigError) {
      return { error: "Map services are not configured on the server." };
    }
    if (error instanceof MapsRequestError) {
      return { error: error.message };
    }
    console.error("Unexpected maps tool error:", error);
    return { error: "Unexpected map services error." };
  }
}
