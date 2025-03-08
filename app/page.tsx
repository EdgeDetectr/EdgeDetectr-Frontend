import ImageProcessor from "./components/image-processor"
import Footer from "./components/footer"
import Link from "next/link"

export default function Home() {
  return (
    <>
      <main className="flex-grow container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Edge Detectr</h1>
        
        <section className="mb-8">
          <p className="text-lg mb-4">
            A free online tool for applying edge detection algorithms to your images.
            No signup required, instantly transform your photos with advanced computer vision techniques.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Available Algorithms</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>OpenCV Sobel - Standard implementation of the Sobel operator</li>
                <li>Alternative Sobel - Custom implementation with different parameters</li>
                <li>OpenMP Sobel - Parallel processing for better performance</li>
                <li>Prewitt - Classic edge detection for both horizontal and vertical edges</li>
                <li>Roberts Cross - Diagonal edge detection with simple 2×2 matrices</li>
              </ul>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">How It Works</h2>
              <ol className="list-decimal list-inside space-y-1">
                <li>Select an edge detection algorithm from the dropdown</li>
                <li>Upload your image (supports JPEG, PNG, GIF, and WebP)</li>
                <li>Wait a few seconds for processing</li>
                <li>Download your edge-detected result</li>
              </ol>
              <p className="mt-2 text-sm">Max file size: 100MB. Limited to one upload every 30 seconds.</p>
            </div>
          </div>
        </section>
        
        <ImageProcessor />
        
        <section className="mt-8 text-sm text-gray-700">
          <h2 className="text-xl font-semibold mb-2">About Edge Detection</h2>
          <p>
            Edge detection is a fundamental technique in image processing and computer vision that identifies boundaries 
            of objects within images. It works by detecting discontinuities in brightness, using mathematical methods 
            to highlight regions where the image brightness changes sharply.
          </p>
          <p className="mt-2">
            Applications include medical imaging, object recognition, and image enhancement. Edge Detectr provides 
            access to several popular algorithms, each with different strengths for various types of images.
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}

