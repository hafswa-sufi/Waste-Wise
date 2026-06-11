import React, { useEffect, useRef } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)
export function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.comparison-item', {
        x: -30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])
  return (
    <section
      ref={sectionRef}
      className="py-24 bg-wastewise-green text-white overflow-hidden relative"
    >
      {/* Decorative background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              Built for Kenya, <br />
              <span className="text-wastewise-orange">
                not borrowed from elsewhere.
              </span>
            </h2>
            <p className="text-lg text-green-100 mb-8 leading-relaxed">
              Unlike apps built for Western markets, WasteWise is designed
              around the realities of Kenyan households. We understand open-air
              market produce, local storage conditions, and the vibrant network
              of local NGOs.
            </p>

            <div className="space-y-6">
              <div className="comparison-item flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-wastewise-orange shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-xl mb-1">
                    Open-Air Market Smart
                  </h4>
                  <p className="text-green-100/80">
                    Rules engine specifically calibrated for sukuma wiki,
                    tomatoes, and onions without barcodes.
                  </p>
                </div>
              </div>
              <div className="comparison-item flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-wastewise-orange shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-xl mb-1">
                    Local NGO Integration
                  </h4>
                  <p className="text-green-100/80">
                    Directly connected to Food Banking Kenya and local estate
                    recycling partners.
                  </p>
                </div>
              </div>
              <div className="comparison-item flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-wastewise-orange shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-xl mb-1">
                    Kenyan Storage Context
                  </h4>
                  <p className="text-green-100/80">
                    Alerts adjusted for local climate and typical household
                    storage methods.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-center">
              Why others fall short
            </h3>

            <div className="space-y-4">
              <div className="bg-black/20 rounded-xl p-5 flex items-center gap-4">
                <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                <p className="text-sm font-medium">
                  Rely entirely on barcode scanning (misses 70% of Kenyan
                  groceries)
                </p>
              </div>
              <div className="bg-black/20 rounded-xl p-5 flex items-center gap-4">
                <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                <p className="text-sm font-medium">
                  Assume continuous cold-chain storage and standard fridge
                  temperatures
                </p>
              </div>
              <div className="bg-black/20 rounded-xl p-5 flex items-center gap-4">
                <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                <p className="text-sm font-medium">
                  No connection to local donation or disposal infrastructure
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
