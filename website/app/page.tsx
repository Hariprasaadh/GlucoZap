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
import { 
  Users, 
  BarChart3, 
  Zap, 
  Shield, 
  Clock, 
  Target,
  Activity,
  Brain,
  Heart,
  Eye,
  CheckCircle,
  ArrowRight,
  Play,
  Star
} from 'lucide-react'

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
        {/* Navigation - Clean transparent */}
        <nav className="absolute top-0 w-full p-6 z-20 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
                <img src="/GlucoZap.png" alt="Glucozap Logo" className="w-8 h-8" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white drop-shadow-lg">GlucoZap</span>
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

        {/* Hero Section - Perfect spacing */}
        <div className="min-h-screen flex items-center px-6 pt-32">
          <div className="max-w-7xl mx-auto w-full">
            <div className="max-w-2xl"> {/* Left-aligned container */}
              
              {/* Main Heading - Perfect spacing */}
<h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
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
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <SignedOut>
                  <SignUpButton>
                    <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black rounded-2xl px-10 py-4 text-lg font-bold transition-all duration-300 shadow-2xl shadow-emerald-500/25 hover:scale-[1.02] transform">
                      start free scan
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </SignUpButton>
                  <Button variant="outline" size="lg" className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-2xl px-10 py-4 text-lg font-semibold transition-all duration-300 backdrop-blur-sm">
                    <Play className="mr-2 w-5 h-5" />
                    watch demo
                  </Button>
                </SignedOut>
                <SignedIn>
                  <Link href="/screening">
                    <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black rounded-2xl px-10 py-4 text-lg font-bold transition-all duration-300 shadow-2xl shadow-emerald-500/25 hover:scale-[1.02] transform">
                      continue to test
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </SignedIn>
              </div>

              {/* Dashboard Navigation - Enhanced */}
              <SignedIn>
                <div className="mb-12">
                  <h3 className="text-lg font-semibold text-white/90 mb-4">Quick Access Dashboards</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/dashboard">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-500/30 text-white hover:bg-blue-600/30 hover:border-blue-400/50 rounded-xl px-6 py-3 text-base font-medium transition-all duration-300 backdrop-blur-md shadow-lg shadow-blue-500/10 hover:scale-[1.02] transform"
                      >
                        <BarChart3 className="mr-2 w-5 h-5" />
                        Health Dashboard
                      </Button>
                    </Link>
                    <Link href="/patient-dashboard">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-2 border-purple-500/30 text-white hover:bg-purple-600/30 hover:border-purple-400/50 rounded-xl px-6 py-3 text-base font-medium transition-all duration-300 backdrop-blur-md shadow-lg shadow-purple-500/10 hover:scale-[1.02] transform"
                      >
                        <Users className="mr-2 w-5 h-5" />
                        Patient Dashboard
                      </Button>
                    </Link>
                  </div>
                </div>
              </SignedIn>

              {/* Trust Indicators - Enhanced */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
                <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-3xl font-black text-emerald-400 group-hover:scale-110 transition-transform duration-300">89%</div>
                    <Target className="w-5 h-5 text-emerald-400/60" />
                  </div>
                  <div className="text-xs text-white/60 font-medium uppercase tracking-wider">accuracy rate</div>
                </div>
                
                <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-3xl font-black text-purple-400 group-hover:scale-110 transition-transform duration-300">60s</div>
                    <Clock className="w-5 h-5 text-purple-400/60" />
                  </div>
                  <div className="text-xs text-white/60 font-medium uppercase tracking-wider">scan time</div>
                </div>

                <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-3xl font-black text-cyan-400 group-hover:scale-110 transition-transform duration-300">24/7</div>
                    <Shield className="w-5 h-5 text-cyan-400/60" />
                  </div>
                  <div className="text-xs text-white/60 font-medium uppercase tracking-wider">available</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Feature Section */}
        <div className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                how it works
              </h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                Revolutionary AI-powered diabetes screening in three simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center backdrop-blur-md bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Eye className="w-8 h-8 text-black" />
                </div>
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl font-black text-emerald-400 mr-2">01</span>
                  <h3 className="text-xl font-bold text-white">scan</h3>
                </div>
                <p className="text-white/70">
                  Take photos of your skin, body, and face with your phone camera for AI analysis
                </p>
              </div>

              <div className="text-center backdrop-blur-md bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-8 h-8 text-black" />
                </div>
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl font-black text-cyan-400 mr-2">02</span>
                  <h3 className="text-xl font-bold text-white">analyze</h3>
                </div>
                <p className="text-white/70">
                  Advanced AI processes your images using clinical diabetes markers and patterns
                </p>
              </div>

              <div className="text-center backdrop-blur-md bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-8 h-8 text-black" />
                </div>
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl font-black text-purple-400 mr-2">03</span>
                  <h3 className="text-xl font-bold text-white">know</h3>
                </div>
                <p className="text-white/70">
                  Get personalized risk score with actionable health recommendations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* New Features Section */}
        <div className="py-20 px-6 bg-gradient-to-b from-transparent to-black/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                why choose glucozap?
              </h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                Leading-edge technology meets healthcare accessibility
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Lightning Fast</h3>
                <p className="text-white/60 text-sm">Results in under 60 seconds</p>
              </div>

              <div className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Privacy First</h3>
                <p className="text-white/60 text-sm">Your data stays secure</p>
              </div>

              <div className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Activity className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Doctor Backed</h3>
                <p className="text-white/60 text-sm">Clinically validated</p>
              </div>

              <div className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No Needles</h3>
                <p className="text-white/60 text-sm">100% non-invasive</p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                trusted by thousands
              </h2>
              <div className="flex items-center justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                ))}
                <span className="ml-2 text-white/70">4.9/5 rating</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center mr-4">
                    <span className="text-black font-bold">JS</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Jennifer S.</h4>
                    <p className="text-white/60 text-sm">Healthcare Worker</p>
                  </div>
                </div>
                <p className="text-white/80 italic">
                  &ldquo;GlucoZap helped me catch my pre-diabetes early. The convenience of testing at home changed everything for me.&rdquo;
                </p>
              </div>

              <div className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                    <span className="text-black font-bold">MR</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Michael R.</h4>
                    <p className="text-white/60 text-sm">Software Engineer</p>
                  </div>
                </div>
                <p className="text-white/80 italic">
                  &ldquo;Quick, accurate, and private. This is the future of health screening. Highly recommend to everyone.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <footer className="border-t border-white/10 backdrop-blur-sm bg-white/5">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <img src="/GlucoZap.png" alt="Glucozap Logo" className="w-8 h-8" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">GlucoZap</span>
                </div>
                <p className="text-white/60 text-sm mb-4">
                  Revolutionary AI-powered diabetes screening technology. Fast, private, and doctor-backed health insights from a simple photo.
                </p>
                <div className="flex space-x-4">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                    <span className="text-white text-sm font-bold">f</span>
                  </div>
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                    <span className="text-white text-sm font-bold">t</span>
                  </div>
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                    <span className="text-white text-sm font-bold">in</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-white/60 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">How it works</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Accuracy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-white/60 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Medical Disclaimer</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 mt-8 pt-8 text-center">
              <p className="text-xs text-white/40">
                © 2025 GlucoZap. Not medical advice. Consult healthcare providers for medical decisions.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
