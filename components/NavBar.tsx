import { useEffect, useState } from 'react'
import { Leaf } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isLanding = location.pathname === '/'
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  const scrollTo = (id: string) => {
    if (!isLanding) {
      navigate('/')
      setTimeout(() => {
        const element = document.getElementById(id)
        if (element)
          element.scrollIntoView({
            behavior: 'smooth',
          })
      }, 100)
      return
    }
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
      })
    }
  }
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || !isLanding ? 'bg-white shadow-md py-4' : 'bg-transparent py-6'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => scrollTo('hero')}
        >
          <Leaf
            className={`w-8 h-8 ${isScrolled || !isLanding ? 'text-wastewise-green' : 'text-white'}`}
          />
          <span
            className={`text-2xl font-bold tracking-tight ${isScrolled || !isLanding ? 'text-gray-900' : 'text-white'}`}
          >
            WasteWise
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollTo('how-it-works')}
            className={`font-medium transition-colors ${isScrolled || !isLanding ? 'text-gray-600 hover:text-wastewise-green' : 'text-gray-200 hover:text-white'}`}
          >
            How It Works
          </button>
          <button
            onClick={() => scrollTo('who-its-for')}
            className={`font-medium transition-colors ${isScrolled || !isLanding ? 'text-gray-600 hover:text-wastewise-green' : 'text-gray-200 hover:text-white'}`}
          >
            Who It's For
          </button>
          <button
            onClick={() => {
              if (!isLanding) {
                navigate('/auth', {
                  state: {
                    authState: 'role-select',
                  },
                })
              } else {
                navigate('/auth', {
                  state: {
                    authState: 'role-select',
                  },
                })
              }
            }}
            className={`px-5 py-2.5 rounded-full font-semibold transition-transform hover:scale-105 ${isScrolled || !isLanding ? 'bg-wastewise-green text-white hover:bg-green-800' : 'bg-white text-wastewise-green hover:bg-gray-100'}`}
          >
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  )
}
