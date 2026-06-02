import Footer from '@/components/layout/Footer'
import Hero from '@/components/landing/Hero'
import Stats from '@/components/landing/Stats'
import Narrative from '@/components/landing/Narrative'
import Features from '@/components/landing/Features'
import HowItWorks from '@/components/landing/HowItWorks'
import Gallery from '@/components/landing/Gallery'
import PhoneMockup from '@/components/landing/PhoneMockup'
import CTA from '@/components/landing/CTA'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-canvas">
      <main className="flex-1">
        {/* Hero includes the floating pill navbar */}
        <Hero />
        <Stats />
        <Narrative />
        <PhoneMockup />
        <HowItWorks />
        <Gallery />
        <Features />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
