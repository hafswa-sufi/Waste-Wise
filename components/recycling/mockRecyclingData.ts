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

export const mockDisposalRequests: DisposalRequest[] = []

export interface CollectionJob {
  id: string
  estate: string
  neighborhood: string
  scheduledDate: string
  weightKg: number
  status: JobStatus
}

export const mockCollectionJobs: CollectionJob[] = []

export interface ScheduleDay {
  day: string
  date: string
  collections: { estate: string; weightKg: number }[]
}

export const mockSchedule: ScheduleDay[] = []

export const weeklyVolumeData = [
  { week: 'Week 1', kg: 0 },
  { week: 'Week 2', kg: 0 },
  { week: 'Week 3', kg: 0 },
  { week: 'Week 4', kg: 0 },
]

export const wasteCategoryData = [
  { name: 'Organic', value: 0, color: '#1B5E20' },
  { name: 'Packaging', value: 0, color: '#FF6F00' },
  { name: 'Mixed', value: 0, color: '#9CA3AF' },
]

export const reportMetrics = {
  totalProcessedThisMonth: 0,
  householdsServed: 0,
}
