import { useEffect, useRef } from 'react'
import { ScanLine, BellRing, Leaf, Heart } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)
const steps = [
  {
    icon: ScanLine,
    title: 'Log your pantry',
    description:
      'Easily log your pantry items manually or by scanning receipts from local supermarkets.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: BellRing,
    title: 'Get timely alerts',
    description:
      'Receive smart expiry alerts before food spoils, helping you plan your meals better.',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    icon: Leaf,
    title: 'Check freshness',
    description:
      'Estimate freshness of farm produce like sukuma wiki and tomatoes that have no expiry date.',
    color: 'bg-green-100 text-wastewise-green',
  },
  {
    icon: Heart,
    title: 'Take action',
    description:
      'Consume, donate surplus to an NGO, or dispose responsibly via local recycling partners.',
    color: 'bg-orange-100 text-wastewise-orange',
  },
]
export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.step-item', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])
  return (
    <section id="how-it-works" ref={sectionRef} className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            How WasteWise Works
          </h2>
          <p className="text-xl text-gray-600">
            A simple, smart way to manage your household food and reduce waste.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Optional connecting line for desktop */}
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gray-200 z-0"></div>

          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={index}
                className="step-item relative z-10 flex flex-col items-center text-center"
              >
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-md border-4 border-white ${step.color}`}
                >
                  <Icon className="w-10 h-10" />
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1 w-full">
                  <div className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
                    Step {index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
