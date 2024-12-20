import MemeGenerator from '../components/MemeGenerator'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-4">
      <div className="container mx-auto">
        <MemeGenerator />
      </div>
    </main>
  )
}

