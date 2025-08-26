import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'kafkadog - Kafka Learning Dashboard',
  description: 'Learn Apache Kafka through hands-on scenarios with a complete, production-like microservices demo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">
                    🐕 kafkadog
                  </h1>
                  <span className="ml-2 text-sm text-gray-500">
                    Kafka Learning Dashboard
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <a
                    href="http://localhost:8080"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    📊 Kafka UI
                  </a>
                </div>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

