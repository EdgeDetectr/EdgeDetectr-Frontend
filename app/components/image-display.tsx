import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface ImageDisplayProps {
  title: string
  imageUrl: string | null
  onDownload?: () => void
}

export default function ImageDisplay({ title, imageUrl, onDownload }: ImageDisplayProps) {
  return (
    <div className="border rounded-lg p-4 w-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {imageUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        )}
      </div>
      {imageUrl ? (
        <div className="flex justify-center items-center min-h-[300px] max-h-[600px] overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title} 
            crossOrigin="anonymous"
            className="max-w-full max-h-full w-auto h-auto object-contain" 
          />
        </div>
      ) : (
        <div className="bg-gray-200 h-48 flex items-center justify-center text-gray-700 font-medium">
          No image
        </div>
      )}
    </div>
  )
}

