import React, { useEffect, useRef } from 'react'
import { X, MapPin, Users, Calendar, Info, Trash2, Scale } from 'lucide-react'
import gsap from 'gsap'
import { DisposalRequest } from './mockRecyclingData'
interface CollectionCardProps {
  request: DisposalRequest | null
  companyName: string
  onClose: () => void
}
export function CollectionCard({
  request,
  companyName,
  onClose,
}: CollectionCardProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (request) {
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
    } else if (cardRef.current && overlayRef.current) {
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
  }, [request])
  const isUrgent = request?.status === 'urgent'
  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 hidden opacity-0"
        onClick={onClose}
      />

      <div
        ref={cardRef}
        className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:w-[500px] bg-white rounded-t-3xl shadow-2xl z-50 hidden flex-col max-h-[88vh] transform translate-y-full"
      >
        <div
          className="w-full flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing"
          onClick={onClose}
        >
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {request && (
          <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Collection Request
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-4">
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                {request.estate}
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {request.neighborhood} • {request.distanceKm}km away
                </span>
              </div>
            </div>

            <div className="mb-6 flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold ${isUrgent ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-wastewise-orange'}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-red-500' : 'bg-wastewise-orange'}`}
                />
                {isUrgent ? 'Urgent Disposal' : 'Scheduled Pickup'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Scale className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">
                    Est. Weight
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">
                  {request.totalWeightKg}
                  <span className="text-base text-gray-500 ml-1">kg</span>
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">
                    Households
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">
                  {request.households}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-3">Waste items</h3>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <ul className="space-y-3">
                  {request.items.map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                          <Trash2 className="w-4 h-4 text-gray-500" />
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

            <div className="mb-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">
                  {request.pickupDate}
                </h4>
                <p className="text-sm text-gray-500 mt-0.5">
                  Coordinated estate pickup
                </p>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100">
              <div className="flex items-start gap-2 mb-4 text-xs text-gray-500">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Confirming this pickup means {companyName} will collect and
                  process this waste on the proposed date.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-wastewise-green text-white rounded-xl font-bold text-lg hover:bg-green-800 transition-colors shadow-md"
                >
                  Accept Collection
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
