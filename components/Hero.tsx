export function Hero() {
  const scrollTo = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
      })
    }
  }
  return (
    <section
      id="hero"
      className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden"
    >
      {/* Background Image - Fresh produce / market vibe */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1596040033229-a9821ebd058d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")',
        }}
      />
      {/* Dark Green Overlay */}
      <div className="absolute inset-0 z-10 bg-wastewise-green/80 mix-blend-multiply" />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-16">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight">
          Track it. <span className="text-wastewise-orange">Save it.</span>{' '}
          Share it.
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto font-medium leading-relaxed">
          Kenya wastes KES 128 billion in food every year. WasteWise helps your
          household be part of the solution.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => scrollTo('sign-up')}
            className="w-full sm:w-auto px-8 py-4 bg-wastewise-orange text-white rounded-full font-bold text-lg transition-all hover:bg-orange-600 hover:scale-105 shadow-lg"
          >
            Get Started
          </button>
          <button
            onClick={() => scrollTo('how-it-works')}
            className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg transition-all hover:bg-white/10 hover:scale-105"
          >
            See How It Works
          </button>
        </div>
      </div>
    </section>
  )
}
