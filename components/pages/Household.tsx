import { useState, useRef } from 'react'
import { HouseholdNavbar } from '../household/HouseholdNavBar'
import type { TabType } from '../household/HouseholdNavBar'
import { PantryTab } from '../household/PantryTab'
import { AlertsTab } from '../household/AlertsTab'
import { FreshnessTab } from '../household/FreshnessTab'
import { DonateTab } from '../household/DonateTab'
import { DisposeTab } from '../household/DisposeTab'
import { useScreenInit } from '../../useScreenInit'
import gsap from 'gsap'
export function Household() {
  const screenInit = useScreenInit()
  const [activeTab, setActiveTab] = useState<TabType>(
    (screenInit?.activeTab as TabType | undefined) ?? 'pantry',
  )
  const contentRef = useRef<HTMLDivElement>(null)
  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return
    // Animate out
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        opacity: 0,
        y: 10,
        duration: 0.15,
        onComplete: () => {
          setActiveTab(tab)
          // Animate in
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
  const renderTabContent = () => {
    switch (activeTab) {
      case 'pantry':
        return <PantryTab />
      case 'alerts':
        return <AlertsTab />
      case 'freshness':
        return <FreshnessTab />
      case 'donate':
        return <DonateTab />
      case 'dispose':
        return <DisposeTab />
      default:
        return <PantryTab />
    }
  }
  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-wastewise-green selection:text-white flex flex-col">
      <HouseholdNavbar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Mobile Tab Navigation (visible only on small screens) */}
      <div className="md:hidden flex overflow-x-auto bg-white border-b border-gray-200 px-2 py-2 hide-scrollbar">
        {(
          ['pantry', 'alerts', 'freshness', 'donate', 'dispose'] as TabType[]
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 text-sm font-bold rounded-full whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-wastewise-green text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <main ref={contentRef} className="flex-1">
        {renderTabContent()}
      </main>
    </div>
  )
}
