import { Navbar } from '../NavBar'
import { Hero } from '../Hero'
import { StatsSection } from '../StatsSection'
import { HowItWorks } from '../HowItWorks'
import { WhoItsFor } from '../WhoItsFor'
import { ProblemSection } from '../ProblemSection'
import { SignUpSection } from '../SignUpSection'
import { Footer } from '../Footer'
export function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-wastewise-green selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <StatsSection />
        <HowItWorks />
        <WhoItsFor />
        <ProblemSection />
        <SignUpSection />
      </main>
      <Footer />
    </div>
  )
}
