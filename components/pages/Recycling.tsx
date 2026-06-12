import { useMemo, useState, useRef } from 'react'
import { RecyclingHeader } from '../recycling/RecyclingHeader'
import type { RecyclingTab } from '../recycling/RecyclingHeader'
import { RecyclingMapView } from '../recycling/RecyclingMapView'
import { CollectionCard } from '../recycling/CollectionCard'
import { MyCollectionsTab } from '../recycling/MyCollectionsTab'
import { ScheduleTab } from '../recycling/ScheduleTab'
import { ReportsTab } from '../recycling/ReportsTab'
import { mockDisposalRequests } from '../recycling/mockRecyclingData'
import { useScreenInit } from '../../useScreenInit'
import gsap from 'gsap'
const COMPANY_NAME = 'EcoLoop Kenya'
export function Recycling() {
  const screenInit = useScreenInit()
  const [activeTab, setActiveTab] = useState<RecyclingTab>(
    (screenInit?.activeTab as RecyclingTab | undefined) ?? 'map',
  )
  const [filterMode, setFilterMode] = useState<'disposal' | 'all'>('disposal')
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    screenInit?.selectedRequestId ?? null,
  )
  const contentRef = useRef<HTMLDivElement>(null)
  const handleTabChange = (tab: RecyclingTab) => {
    if (tab === activeTab) return
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        opacity: 0,
        y: 10,
        duration: 0.15,
        onComplete: () => {
          setActiveTab(tab)
          gsap.fromTo(
            contentRef.current,
            {
              opacity: 0,
              y: -10,
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.25,
              ease: 'power2.out',
            },
          )
        },
      })
    } else {
      setActiveTab(tab)
    }
  }
  const sortedRequests = useMemo(
    () => [...mockDisposalRequests].sort((a, b) => a.distanceKm - b.distanceKm),
    [],
  )
  const selectedRequest = useMemo(
    () => mockDisposalRequests.find((r) => r.id === selectedRequestId) || null,
    [selectedRequestId],
  )
  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden font-sans selection:bg-wastewise-green selection:text-white">
      <RecyclingHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        companyName={COMPANY_NAME}
      />

      <div ref={contentRef} className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'map' && (
          <RecyclingMapView
            requests={sortedRequests}
            onSelectRequest={setSelectedRequestId}
            filterMode={filterMode}
            setFilterMode={setFilterMode}
          />
        )}
        {activeTab === 'collections' && (
          <div className="flex-1 overflow-y-auto">
            <MyCollectionsTab />
          </div>
        )}
        {activeTab === 'schedule' && (
          <div className="flex-1 overflow-y-auto">
            <ScheduleTab />
          </div>
        )}
        {activeTab === 'reports' && (
          <div className="flex-1 overflow-y-auto">
            <ReportsTab />
          </div>
        )}
      </div>

      <CollectionCard
        request={selectedRequest}
        companyName={COMPANY_NAME}
        onClose={() => setSelectedRequestId(null)}
      />
    </div>
  )
}
