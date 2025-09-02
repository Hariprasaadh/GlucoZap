import type { Metadata } from "next"
import { Inter, Poppins, DM_Sans } from "next/font/google"
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css"

// Configure the fonts
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins", 
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

// Alternative option - Inter (clean and modern)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Glucozap - Early Diabetes Detection",
  description: "Advanced AI-powered diabetes screening through visual biomarkers. No needles, no lab visits required.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html 
        lang="en" 
        className={`${dmSans.variable} ${poppins.variable} antialiased`}
      >
        <body className="font-sans">{children}</body>
      </html>
    </ClerkProvider>
  )
}
