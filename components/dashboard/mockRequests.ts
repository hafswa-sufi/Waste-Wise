export type RequestType = 'donation' | 'disposal'

export interface RequestItem {
  name: string
  qty: string
}

export interface WasteRequest {
  id: string
  estate: string
  neighborhood: string
  lat: number
  lng: number
  type: RequestType
  items: RequestItem[]
  households: number
  pickupDate: string
  distanceKm: number
}

export const mockRequests: WasteRequest[] = [
  {
    id: 'req-1',
    estate: 'Kilimani Heights Apartments',
    neighborhood: 'Kilimani',
    lat: -1.2884,
    lng: 36.7848,
    type: 'donation',
    items: [
      { name: 'Tomatoes', qty: '2kg' },
      { name: 'Sukuma Wiki', qty: '1 bunch' },
      { name: 'Uji', qty: '3 packets' },
    ],
    households: 4,
    pickupDate: 'Saturday, 13 June 2026',
    distanceKm: 1.2,
  },
  {
    id: 'req-2',
    estate: 'Westlands Executive Suites',
    neighborhood: 'Westlands',
    lat: -1.2644,
    lng: 36.8045,
    type: 'disposal',
    items: [
      { name: 'Organic Waste', qty: '15kg' },
      { name: 'Spoiled Onions', qty: '2kg' },
    ],
    households: 12,
    pickupDate: 'Sunday, 14 June 2026',
    distanceKm: 3.5,
  },
  {
    id: 'req-3',
    estate: 'Karen Green Estate',
    neighborhood: 'Karen',
    lat: -1.3323,
    lng: 36.7065,
    type: 'donation',
    items: [
      { name: 'Mangoes', qty: '1.5kg' },
      { name: 'Cabbage', qty: '2 heads' },
      { name: 'Maize Flour', qty: '1 packet' },
    ],
    households: 2,
    pickupDate: 'Saturday, 13 June 2026',
    distanceKm: 8.4,
  },
  {
    id: 'req-4',
    estate: 'Lavington Villas',
    neighborhood: 'Lavington',
    lat: -1.2789,
    lng: 36.7667,
    type: 'disposal',
    items: [{ name: 'Mixed Organic Waste', qty: '20kg' }],
    households: 18,
    pickupDate: 'Monday, 15 June 2026',
    distanceKm: 4.1,
  },
  {
    id: 'req-5',
    estate: 'Runda Gardens',
    neighborhood: 'Runda',
    lat: -1.2185,
    lng: 36.8167,
    type: 'donation',
    items: [
      { name: 'Potatoes', qty: '5kg' },
      { name: 'Carrots', qty: '2kg' },
    ],
    households: 3,
    pickupDate: 'Saturday, 13 June 2026',
    distanceKm: 9.2,
  },
  {
    id: 'req-6',
    estate: 'South B Apartments',
    neighborhood: 'South B',
    lat: -1.3125,
    lng: 36.8333,
    type: 'donation',
    items: [
      { name: 'Rice', qty: '2kg' },
      { name: 'Beans', qty: '1kg' },
    ],
    households: 5,
    pickupDate: 'Sunday, 14 June 2026',
    distanceKm: 2.8,
  },
  {
    id: 'req-7',
    estate: 'Kileleshwa Manors',
    neighborhood: 'Kileleshwa',
    lat: -1.275,
    lng: 36.7833,
    type: 'disposal',
    items: [{ name: 'Compost Material', qty: '10kg' }],
    households: 8,
    pickupDate: 'Monday, 15 June 2026',
    distanceKm: 2.5,
  },
  {
    id: 'req-8',
    estate: 'Parklands Towers',
    neighborhood: 'Parklands',
    lat: -1.2667,
    lng: 36.8167,
    type: 'donation',
    items: [
      { name: 'Nduma (Arrowroot)', qty: '3kg' },
      { name: 'Sweet Potatoes', qty: '2kg' },
    ],
    households: 6,
    pickupDate: 'Saturday, 13 June 2026',
    distanceKm: 3.1,
  },
]
