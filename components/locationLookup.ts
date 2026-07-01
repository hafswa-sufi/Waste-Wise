export type LocationLookupResult = {
  lat: number
  lng: number
  label: string
}

type NominatimResult = {
  lat?: string
  lon?: string
  display_name?: string
}

function uniqueNonEmpty(parts: string[]) {
  return Array.from(new Set(parts.map((part) => part.trim()).filter(Boolean)))
}

export function buildHouseholdLocationQueries(
  buildingNameNumber: string,
  location: string,
) {
  const building = buildingNameNumber.trim()
  const place = location.trim()

  return uniqueNonEmpty([
    building && place ? `${building}, ${place}, Nairobi, Kenya` : '',
    building && place ? `${building}, ${place}, Kenya` : '',
    place ? `${place}, Nairobi, Kenya` : '',
    place ? `${place}, Kenya` : '',
    building ? `${building}, Nairobi, Kenya` : '',
    building ? `${building}, Kenya` : '',
  ])
}

export async function searchKenyaLocation(queries: string[]) {
  for (const query of queries) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=3&countrycodes=ke&addressdetails=1&q=${encodeURIComponent(
        query,
      )}`,
    )
    const results = (await response.json()) as NominatimResult[]
    const result = results.find((item) => {
      const lat = Number(item.lat)
      const lng = Number(item.lon)
      return Number.isFinite(lat) && Number.isFinite(lng)
    })

    if (result) {
      return {
        lat: Number(result.lat),
        lng: Number(result.lon),
        label: result.display_name ?? query,
      } satisfies LocationLookupResult
    }
  }

  return null
}
