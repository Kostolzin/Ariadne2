import type {
  AiDecideRequest,
  AiDecideResponse,
  DistanceRequest,
  DistanceResponse,
  EventRequest,
  EventResponse,
  MapsConfigResponse,
  NearestOfficeRequest,
  NearestOfficeResponse,
} from "../types/api";

async function postJson<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${path} failed (${response.status}): ${text}`);
  }

  return (await response.json()) as TRes;
}

async function getJson<TRes>(path: string): Promise<TRes> {
  const response = await fetch(path);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${path} failed (${response.status}): ${text}`);
  }
  return (await response.json()) as TRes;
}

export function decide(body: AiDecideRequest): Promise<AiDecideResponse> {
  return postJson("/ai/decide", body);
}

export function sendEvent(body: EventRequest): Promise<EventResponse> {
  return postJson("/api/event", body);
}

export function findNearestOffice(
  body: NearestOfficeRequest,
): Promise<NearestOfficeResponse> {
  return postJson("/api/maps/nearest", body);
}

export function fetchMapsConfig(): Promise<MapsConfigResponse> {
  return getJson("/api/maps/config");
}

export function fetchDistance(body: DistanceRequest): Promise<DistanceResponse> {
  return postJson("/api/maps/distance", body);
}
