import React, { useEffect, useRef } from 'react'
import { TrendingDown, Coins, Users } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)
export function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const counter1Ref = useRef<HTMLSpanElement>(null)
  const counter2Ref = useRef<HTMLSpanElement>(null)
  const counter3Ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate cards fading in
      gsap.from('.stat-card', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      })
      // Animate counters
      const animateCounter = (
        target: Element | null,
        endValue: number,
        isDecimal: boolean = false,
      ) => {
        if (!target) return
        gsap.to(target, {
          innerHTML: endValue,
          duration: 2,
          snap: {
            innerHTML: isDecimal ? 0.1 : 1,
          },
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
          },
          onUpdate: function () {
            if (isDecimal) {
              target.innerHTML = Number(this.targets()[0].innerHTML).toFixed(1)
            }
          },
        })
      }
      // Initial values are 0 in the DOM, GSAP animates them to target
      if (counter1Ref.current) counter1Ref.current.innerHTML = '0'
      if (counter2Ref.current) counter2Ref.current.innerHTML = '0'
      if (counter3Ref.current) counter3Ref.current.innerHTML = '0'
      animateCounter(counter1Ref.current, 5.2, true)
      animateCounter(counter2Ref.current, 128, false)
      animateCounter(counter3Ref.current, 4, false) // For "1 in 4"
    }, sectionRef)
    return () => ctx.revert()
  }, [])
  return (
    <section
      ref={sectionRef}
      className="py-24 bg-white relative z-20 -mt-8 rounded-t-3xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Stat 1 */}
          <div className="stat-card bg-gray-50 rounded-2xl p-8 border border-gray-100 shadow-sm text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <TrendingDown className="w-8 h-8" />
            </div>
            <h3 className="text-5xl font-extrabold text-gray-900 mb-2 flex items-baseline justify-center gap-1">
              <span ref={counter1Ref}>5.2</span>
              <span className="text-2xl text-gray-500 font-bold">M</span>
            </h3>
            <p className="text-gray-600 font-medium">
              Tonnes of food wasted annually in Kenya
            </p>
          </div>

          {/* Stat 2 */}
          <div className="stat-card bg-gray-50 rounded-2xl p-8 border border-gray-100 shadow-sm text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-orange-100 text-wastewise-orange rounded-full flex items-center justify-center mb-6">
              <Coins className="w-8 h-8" />
            </div>
            <h3 className="text-5xl font-extrabold text-gray-900 mb-2 flex items-baseline justify-center gap-2">
              <span className="text-2xl text-gray-500 font-bold">KES</span>
              <span ref={counter2Ref}>128</span>
              <span className="text-2xl text-gray-500 font-bold">B</span>
            </h3>
            <p className="text-gray-600 font-medium">
              Lost to household food waste each year
            </p>
          </div>

          {/* Stat 3 */}
          <div className="stat-card bg-gray-50 rounded-2xl p-8 border border-gray-100 shadow-sm text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-5xl font-extrabold text-gray-900 mb-2 flex items-baseline justify-center gap-2">
              <span className="text-4xl">1 in</span>
              <span ref={counter3Ref}>4</span>
            </h3>
            <p className="text-gray-600 font-medium">
              Kenyans face food insecurity
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
