import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { currentUser } from '@clerk/nextjs'

export default async function Home() {
  const user = await currentUser()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="container mx-auto py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
          <span className="text-2xl font-bold text-blue-800">Glucozap</span>
        </div>
        <nav className="flex space-x-4">
          {user ? (
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <main className="container mx-auto py-12">
        <section className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Early Diabetes Detection Through AI Analysis
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Glucozap uses computer vision to analyze skin, body composition, and other markers to assess your diabetes risk - all from simple photos.
          </p>
          <Button size="lg" asChild>
            <Link href={user ? "/screening" : "/sign-up"}>
              Start Your Assessment
            </Link>
          </Button>
        </section>

        <section className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle>Skin Analysis</CardTitle>
              <CardDescription>Detect insulin resistance markers</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Identify acanthosis nigricans and other skin changes associated with diabetes risk.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Body Composition</CardTitle>
              <CardDescription>Assess fat distribution patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Analyze waist-to-hip ratio and body fat distribution through pose estimation.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Foot Health</CardTitle>
              <CardDescription>Early ulcer detection</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Identify potential diabetic foot complications before they become serious.</p>
            </CardContent>
          </Card>
        </section>

        <section className="bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6 mt-8">
            {['Create Account', 'Complete Screening', 'AI Analysis', 'Get Results'].map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mb-4">
                  {index + 1}
                </div>
                <h3 className="font-medium">{step}</h3>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}