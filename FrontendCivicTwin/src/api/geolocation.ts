export interface UserLocation {
  lat: number;
  lng: number;
}

export class GeolocationError extends Error {
  constructor(
    message: string,
    public readonly code: "unavailable" | "denied" | "timeout" | "error",
  ) {
    super(message);
  }
}

export function requestUserLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(
        new GeolocationError("Geolocation is not available in this browser.", "unavailable"),
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new GeolocationError("Location access was denied.", "denied"));
        } else if (error.code === error.TIMEOUT) {
          reject(new GeolocationError("Location request timed out.", "timeout"));
        } else {
          reject(new GeolocationError(error.message, "error"));
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}
