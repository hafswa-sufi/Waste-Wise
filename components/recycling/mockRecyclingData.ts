export type DisposalStatus = 'urgent' | 'scheduled'
export type JobStatus = 'Confirmed' | 'En Route' | 'Collected' | 'Processed'

export interface WasteItem {
  name: string
  qty: string
}

export interface DisposalRequest {
  id: string
  estate: string
  neighborhood: string
  lat: number
  lng: number
  status: DisposalStatus
  items: WasteItem[]
  totalWeightKg: number
  households: number
  pickupDate: string
  distanceKm: number
}

export const mockDisposalRequests: DisposalRequest[] = [
  {
    id: 'dr-1',
    estate: 'Buruburu Block C',
    neighborhood: 'Buruburu',
    lat: -1.288,
    lng: 36.876,
    status: 'urgent',
    items: [
      { name: 'Overripe tomatoes', qty: '5kg' },
      { name: 'Wilted sukuma wiki', qty: '2 bunches' },
      { name: 'Ugali leftovers', qty: '1.2kg' },
    ],
    totalWeightKg: 5.1,
    households: 6,
    pickupDate: 'Sat, 13 Jun 2026',
    distanceKm: 2.1,
  },
  {
    id: 'dr-2',
    estate: 'Umoja Estate Phase 2',
    neighborhood: 'Umoja',
    lat: -1.282,
    lng: 36.898,
    status: 'urgent',
    items: [
      { name: 'Spoiled milk cartons', qty: '4 units' },
      { name: 'Rotten mangoes', qty: '3kg' },
    ],
    totalWeightKg: 7.4,
    households: 9,
    pickupDate: 'Sat, 13 Jun 2026',
    distanceKm: 3.4,
  },
  {
    id: 'dr-3',
    estate: 'South B Maisonettes',
    neighborhood: 'South B',
    lat: -1.3125,
    lng: 36.8333,
    status: 'scheduled',
    items: [
      { name: 'Vegetable peelings', qty: '8kg' },
      { name: 'Stale bread', qty: '2kg' },
    ],
    totalWeightKg: 10.0,
    households: 14,
    pickupDate: 'Mon, 15 Jun 2026',
    distanceKm: 4.0,
  },
  {
    id: 'dr-4',
    estate: 'Kileleshwa Manors',
    neighborhood: 'Kileleshwa',
    lat: -1.275,
    lng: 36.7833,
    status: 'scheduled',
    items: [{ name: 'Mixed organic waste', qty: '12kg' }],
    totalWeightKg: 12.0,
    households: 8,
    pickupDate: 'Tue, 16 Jun 2026',
    distanceKm: 5.5,
  },
  {
    id: 'dr-5',
    estate: 'Donholm Greens',
    neighborhood: 'Donholm',
    lat: -1.295,
    lng: 36.888,
    status: 'urgent',
    items: [
      { name: 'Spoiled cabbage', qty: '4 heads' },
      { name: 'Overripe bananas', qty: '2.5kg' },
    ],
    totalWeightKg: 6.8,
    households: 7,
    pickupDate: 'Sun, 14 Jun 2026',
    distanceKm: 3.0,
  },
  {
    id: 'dr-6',
    estate: 'Lavington Villas',
    neighborhood: 'Lavington',
    lat: -1.2789,
    lng: 36.7667,
    status: 'scheduled',
    items: [{ name: 'Compost material', qty: '15kg' }],
    totalWeightKg: 15.0,
    households: 18,
    pickupDate: 'Wed, 17 Jun 2026',
    distanceKm: 6.2,
  },
  {
    id: 'dr-7',
    estate: 'Pipeline Apartments',
    neighborhood: 'Pipeline',
    lat: -1.318,
    lng: 36.899,
    status: 'urgent',
    items: [
      { name: 'Rotten potatoes', qty: '6kg' },
      { name: 'Spoiled rice', qty: '1.5kg' },
    ],
    totalWeightKg: 7.5,
    households: 11,
    pickupDate: 'Sun, 14 Jun 2026',
    distanceKm: 4.8,
  },
]

export interface CollectionJob {
  id: string
  estate: string
  neighborhood: string
  scheduledDate: string
  weightKg: number
  status: JobStatus
}

export const mockCollectionJobs: CollectionJob[] = [
  {
    id: 'cj-1',
    estate: 'Buruburu Block C',
    neighborhood: 'Buruburu',
    scheduledDate: '13 Jun 2026',
    weightKg: 5.1,
    status: 'En Route',
  },
  {
    id: 'cj-2',
    estate: 'Umoja Estate Phase 2',
    neighborhood: 'Umoja',
    scheduledDate: '13 Jun 2026',
    weightKg: 7.4,
    status: 'Confirmed',
  },
  {
    id: 'cj-3',
    estate: 'Greenspan Mall Residences',
    neighborhood: 'Donholm',
    scheduledDate: '10 Jun 2026',
    weightKg: 9.2,
    status: 'Collected',
  },
  {
    id: 'cj-4',
    estate: 'Fedha Estate',
    neighborhood: 'Embakasi',
    scheduledDate: '08 Jun 2026',
    weightKg: 11.0,
    status: 'Processed',
  },
  {
    id: 'cj-5',
    estate: 'South B Maisonettes',
    neighborhood: 'South B',
    scheduledDate: '15 Jun 2026',
    weightKg: 10.0,
    status: 'Confirmed',
  },
  {
    id: 'cj-6',
    estate: 'Nyayo Estate',
    neighborhood: 'Embakasi',
    scheduledDate: '09 Jun 2026',
    weightKg: 8.3,
    status: 'Processed',
  },
]

export interface ScheduleDay {
  day: string
  date: string
  collections: { estate: string; weightKg: number }[]
}

export const mockSchedule: ScheduleDay[] = [
  {
    day: 'Mon',
    date: '15',
    collections: [{ estate: 'South B Maisonettes', weightKg: 10.0 }],
  },
  {
    day: 'Tue',
    date: '16',
    collections: [{ estate: 'Kileleshwa Manors', weightKg: 12.0 }],
  },
  {
    day: 'Wed',
    date: '17',
    collections: [
      { estate: 'Lavington Villas', weightKg: 15.0 },
      { estate: 'Riverside Court', weightKg: 4.5 },
    ],
  },
  { day: 'Thu', date: '18', collections: [] },
  {
    day: 'Fri',
    date: '19',
    collections: [{ estate: 'Parklands Towers', weightKg: 6.0 }],
  },
  {
    day: 'Sat',
    date: '20',
    collections: [
      { estate: 'Buruburu Block C', weightKg: 5.1 },
      { estate: 'Umoja Phase 2', weightKg: 7.4 },
    ],
  },
  { day: 'Sun', date: '21', collections: [] },
]

export const weeklyVolumeData = [
  { week: 'Week 1', kg: 142 },
  { week: 'Week 2', kg: 188 },
  { week: 'Week 3', kg: 165 },
  { week: 'Week 4', kg: 224 },
]

export const wasteCategoryData = [
  { name: 'Organic', value: 540, color: '#1B5E20' },
  { name: 'Packaging', value: 120, color: '#FF6F00' },
  { name: 'Mixed', value: 59, color: '#9CA3AF' },
]

export const reportMetrics = {
  totalProcessedThisMonth: 719,
  householdsServed: 184,
}
