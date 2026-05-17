import { resolveLocationFromTwoGis } from "@/lib/locations";

function parseCoordinate(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  const key = process.env.NEXT_PUBLIC_2GIS_API_KEY;
  if (!key) {
    return Response.json({ error: "2GIS API key is not configured." }, { status: 503 });
  }

  const url = new URL(request.url);
  const latitude = parseCoordinate(url.searchParams.get("lat"));
  const longitude = parseCoordinate(url.searchParams.get("lng"));

  if (latitude === null || longitude === null) {
    return Response.json({ error: "Coordinates are required." }, { status: 400 });
  }

  try {
    const location = await resolveLocationFromTwoGis({
      latitude,
      longitude,
      key,
      locale: "ru_KZ"
    });

    if (!location.district) {
      return Response.json({ error: "District was not found for this point." }, { status: 404 });
    }

    return Response.json(location, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resolve location.";
    return Response.json({ error: message }, { status: 502 });
  }
}
