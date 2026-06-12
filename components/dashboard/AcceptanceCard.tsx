import React, { useEffect, useRef } from 'react'
import { X, MapPin, Users, Calendar, Info, Leaf, Truck } from 'lucide-react'
import gsap from 'gsap'
import type { WasteRequest } from './mockRequests'

const XIcon = X as unknown as React.ComponentType<React.SVGProps<SVGSVGElement>>
const MapPinIcon = MapPin as unknown as React.ComponentType<
  React.SVGProps<SVGSVGElement>
>
const UsersIcon = Users as unknown as React.ComponentType<
  React.SVGProps<SVGSVGElement>
>
const CalendarIcon = Calendar as unknown as React.ComponentType<
  React.SVGProps<SVGSVGElement>
>
const InfoIcon = Info as unknown as React.ComponentType<
  React.SVGProps<SVGSVGElement>
>
const LeafIcon = Leaf as unknown as React.ComponentType<
  React.SVGProps<SVGSVGElement>
>
const TruckIcon = Truck as unknown as React.ComponentType<
  React.SVGProps<SVGSVGElement>
>

interface AcceptanceCardProps {
  request: WasteRequest | null
  onClose: () => void
}
export function AcceptanceCard({ request, onClose }: AcceptanceCardProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (request) {
      // Animate in
      gsap.to(overlayRef.current, {
        opacity: 1,
        duration: 0.3,
        display: 'block',
        ease: 'power2.out',
      })
      gsap.fromTo(
        cardRef.current,
        {
          y: '100%',
        },
        {
          y: '0%',
          duration: 0.5,
          ease: 'power3.out',
          display: 'flex',
        },
      )
    } else {
      // Animate out
      if (cardRef.current && overlayRef.current) {
        gsap.to(cardRef.current, {
          y: '100%',
          duration: 0.4,
          ease: 'power3.in',
          onComplete: () => {
            if (cardRef.current) cardRef.current.style.display = 'none'
          },
        })
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            if (overlayRef.current) overlayRef.current.style.display = 'none'
          },
        })
      }
    }
  }, [request])
  return (
    <>
      {/* Backdrop Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 hidden opacity-0"
        onClick={onClose}
      />

      {/* Bottom Sheet Card */}
      <div
        ref={cardRef}
        className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:w-[480px] bg-white rounded-t-3xl shadow-2xl z-50 hidden flex-col max-h-[85vh] transform translate-y-full"
      >
        {/* Drag Handle */}
        <div
          className="w-full flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing"
          onClick={onClose}
        >
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {request && (
          <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Pickup Request
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Location Info */}
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                {request.estate}
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPinIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {request.neighborhood}, Nairobi
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mb-8">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold ${request.type === 'donation' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-wastewise-orange'}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${request.type === 'donation' ? 'bg-red-500' : 'bg-wastewise-orange'}`}
                />
                {request.type === 'donation'
                  ? 'Donation Request'
                  : 'Disposal Request'}
              </span>
            </div>

            {/* Items Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">
                  Items for collection
                </h3>
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                  <UsersIcon className="w-4 h-4" />
                  {request.households} households
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <ul className="space-y-3">
                  {request.items.map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                          {request.type === 'donation' ? (
                            <LeafIcon className="w-4 h-4 text-wastewise-green" />
                          ) : (
                            <TruckIcon className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <span className="font-medium text-gray-900">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-500">
                        {item.qty}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Date Section */}
            <div className="mb-8 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">
                  {request.pickupDate}
                </h4>
                <p className="text-sm text-gray-500 mt-0.5">
                  Shared coordinated pickup
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto pt-4 border-t border-gray-100">
              <div className="flex items-start gap-2 mb-4 text-xs text-gray-500">
                <InfoIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Accepting confirms your organisation will collect from this
                  location on the proposed date.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-wastewise-green text-white rounded-xl font-bold text-lg hover:bg-green-800 transition-colors shadow-md"
                >
                  Accept Pickup
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
