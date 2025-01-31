import ImageProcessor from "./components/image-processor"

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">edge detectr</h1>
      <ImageProcessor />
    </main>
  )
}

