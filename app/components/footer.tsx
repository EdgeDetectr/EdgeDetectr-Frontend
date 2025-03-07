import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t py-6 bg-gray-100 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-semibold mb-2">Edge Detectr</h3>
            <p className="text-gray-700 text-sm">
              A modern edge detection application
            </p>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-gray-700 mb-2">Developed by Kailin Xing</p>
            <div className="flex space-x-4 justify-center md:justify-end">
              <Link 
                href="https://github.com/kailinxGitHub" 
                target="_blank" 
                className="text-gray-700 hover:text-gray-900"
              >
                GitHub
              </Link>
              <Link 
                href="https://linkedin.com/in/kailinx" 
                target="_blank" 
                className="text-gray-700 hover:text-gray-900"
              >
                LinkedIn
              </Link>
            </div>
            <p className="text-gray-600 text-xs mt-2 font-medium">
              © {new Date().getFullYear()} Kailin Xing. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
} 