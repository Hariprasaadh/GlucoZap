'use client'
import Spline from '@splinetool/react-spline'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white antialiased relative overflow-hidden">
      {/* Spline 3D Background - Fixed positioning and z-index */}
      <div className="fixed inset-0 z-0 opacity-90">
        <Spline
          scene="https://prod.spline.design/nQdF7I5qyhuWJLJk/scene.splinecode" 
        />
      </div>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-[1]" />

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="absolute top-0 w-full p-6 z-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/GlucoZap.png" alt="Glucozap Logo" className="w-8 h-8" />
              </div>
              <span className="text-xl font-bold tracking-tight">GlucoZap</span>
            </div>

            <div className="flex items-center space-x-4">
              <SignedOut>
                <SignInButton>
                  <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm">
                    sign in
                  </Button>
                </SignInButton>
                <SignUpButton>
                  <Button className="bg-emerald-500/90 hover:bg-emerald-400 text-black rounded-xl px-6 py-2.5 font-bold transition-all duration-300 shadow-lg shadow-emerald-500/25 backdrop-blur-sm">
                    get started
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="min-h-screen flex items-center px-6">
          <div className="max-w-7xl mx-auto w-full">
            <div className="max-w-2xl"> {/* Left-aligned container */}
              
              {/* Main Heading */}
<h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 mt-10 leading-tight tracking-tight">
  Check your
  <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
    Diabetes Risk
  </span>
  <span className="block text-3xl sm:text-4xl lg:text-5xl text-white/70 font-normal mt-2">
    in just 60 seconds 🚀
  </span>
</h1>

{/* Subheading */}
<p className="text-lg sm:text-xl text-white/80 mb-12 leading-relaxed">
  AI-powered health insights from a simple photo — no needles, no waiting.  
  <span className="block mt-2 text-white font-semibold">
    Fast. Private. Doctor-backed. 
  </span>
</p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-16">
                <SignedOut>
                  <SignUpButton>
                    <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black rounded-2xl px-10 py-4 text-lg font-bold transition-all duration-300 shadow-2xl shadow-emerald-500/25 hover:scale-[1.02] transform">
                      start free scan
                      <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Button>
                  </SignUpButton>
                  <Button variant="outline" size="lg" className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-2xl px-10 py-4 text-lg font-semibold transition-all duration-300 backdrop-blur-sm">
                    watch demo
                  </Button>
                </SignedOut>
                <SignedIn>
                  <Link href="/screening">
                    <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black rounded-2xl px-10 py-4 text-lg font-bold transition-all duration-300 shadow-2xl shadow-emerald-500/25 hover:scale-[1.02] transform">
                      continue to test
                      <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Button>
                  </Link>
                </SignedIn>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-md">
                <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-3xl font-black text-emerald-400 mb-1">89%</div>
                  <div className="text-xs text-white/60 font-medium uppercase tracking-wider">accuracy rate</div>
                </div>
                
                <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-3xl font-black text-purple-400 mb-1">60s</div>
                  <div className="text-xs text-white/60 font-medium uppercase tracking-wider">scan time</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Feature Section */}
        <div className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                how it works
              </h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                simple 3-step process to assess your diabetes risk
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center backdrop-blur-md bg-white/10 rounded-2xl p-8 border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-black text-black">01</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">scan</h3>
                <p className="text-white/70">
                  take photos of your skin, body, and face with your phone camera
                </p>
              </div>

              <div className="text-center backdrop-blur-md bg-white/10 rounded-2xl p-8 border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-black text-black">02</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">analyze</h3>
                <p className="text-white/70">
                  ai processes your images using clinical diabetes markers
                </p>
              </div>

              <div className="text-center backdrop-blur-md bg-white/10 rounded-2xl p-8 border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-black text-black">03</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">know</h3>
                <p className="text-white/70">
                  get personalized risk score with actionable recommendations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Footer */}
        <footer className="border-t border-white/10 backdrop-blur-sm bg-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs text-white/40 mt-3 pb-3">
              © 2025 glucozap. not medical advice. consult healthcare providers.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
