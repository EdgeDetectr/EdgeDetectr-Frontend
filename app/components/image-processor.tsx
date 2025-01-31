"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import ImageUpload from "./image-upload"
import ImageDisplay from "./image-display"
import axios from "axios"

const operators = [
  "opencv sobel",
  "alternative sobel",
  "openmp sobel",
  "prewitt",
  "roberts cross",
]

export default function ImageProcessor() {
  const [operator, setOperator] = useState<string>("")
  const [beforeImage, setBeforeImage] = useState<string | null>(null)
  const [afterImage, setAfterImage] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const handleFileUpload = async (file: File) => {
    if (!operator) {
      alert("Please select an operator before uploading.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("operator", operator)

    try {
      setProgress(50)
      const response = await axios.post(
        `http://localhost:3001/api/operators/${operator}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: "text",
        }
      )

      const responseData = JSON.parse(response.data)
      const { inputImage, outputImage } = responseData

      setBeforeImage(`http://localhost:3001/uploads/${inputImage}`)
      setAfterImage(`http://localhost:3001/results/${outputImage}`)
      setProgress(100)
    } catch (error) {
      console.error("Error processing image:", error)
      setProgress(0)
      alert("Error processing image. Please try again.")
    }
  }

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'blob'
      })
      
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Failed to download image')
    }
  }

  return (
    <div className="space-y-4">
      <Select onValueChange={setOperator}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select operator" />
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op} value={op}>
              {op}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ImageUpload 
        onFileUpload={handleFileUpload} 
        isOperatorSelected={Boolean(operator)} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ImageDisplay 
          title="Before" 
          imageUrl={beforeImage}
          onDownload={beforeImage ? 
            () => handleDownload(beforeImage, 'original-image.jpg') : 
            undefined
          }
        />
        <ImageDisplay 
          title="After" 
          imageUrl={afterImage}
          onDownload={afterImage ? 
            () => handleDownload(afterImage, 'processed-image.jpg') : 
            undefined
          }
        />
      </div>

      {progress > 0 && progress < 100 && <Progress value={progress} className="w-full" />}
    </div>
  )
}

