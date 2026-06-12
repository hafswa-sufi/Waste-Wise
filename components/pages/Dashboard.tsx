import { useMemo, useState } from 'react'
import { DashboardHeader } from '../dashboard/DashboardHeader'
import { MapView } from '../dashboard/MapView'
import { RequestsSidebar } from '../dashboard/RequestsSidebar'
import { AcceptanceCard } from '../dashboard/AcceptanceCard'
import { mockRequests } from '../dashboard/mockRequests'
import { useScreenInit } from '../../useScreenInit'
export function Dashboard() {
  const screenInit = useScreenInit()
  const [filterMode, setFilterMode] = useState<'all' | 'donation' | 'disposal'>(
    'all',
  )
  const [userType, setUserType] = useState<'NGO' | 'Recycling Company'>('NGO')
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    screenInit?.selectedRequestId ?? null,
  )
  const filteredRequests = useMemo(() => {
    let filtered = mockRequests
    if (filterMode !== 'all') {
      filtered = mockRequests.filter((req) => req.type === filterMode)
    }
    // Sort by distance
    return filtered.sort((a, b) => a.distanceKm - b.distanceKm)
  }, [filterMode])
  const selectedRequest = useMemo(() => {
    return mockRequests.find((req) => req.id === selectedRequestId) || null
  }, [selectedRequestId])
  return (
    <div className="h-screen w-full flex flex-col bg-white overflow-hidden font-sans selection:bg-wastewise-green selection:text-white">
      <DashboardHeader
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        userType={userType}
        setUserType={setUserType}
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <MapView
          requests={filteredRequests}
          onSelectRequest={setSelectedRequestId}
          selectedRequestId={selectedRequestId}
        />

        <RequestsSidebar
          requests={filteredRequests}
          onSelectRequest={setSelectedRequestId}
          selectedRequestId={selectedRequestId}
        />

        <AcceptanceCard
          request={selectedRequest}
          onClose={() => setSelectedRequestId(null)}
        />
      </div>
    </div>
  )
}
