"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { TermsDialog } from "./terms-dialog"

interface ImageUploadProps {
  onFileUpload: (file: File) => void
  isOperatorSelected: boolean
  canUpload?: boolean
  timeRemaining?: number
}

export default function ImageUpload({ 
  onFileUpload, 
  isOperatorSelected,
  canUpload = true,
  timeRemaining = 0
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    if (!isOperatorSelected) {
      alert("Please select an operator before uploading.")
      return
    }
    
    if (!canUpload) {
      alert(`Rate limit exceeded. Please wait ${timeRemaining} seconds before uploading another image.`)
      return
    }
    
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isOperatorSelected) {
      alert("Please select an operator before uploading.")
      return
    }
    
    if (!canUpload) {
      alert(`Rate limit exceeded. Please wait ${timeRemaining} seconds before uploading another image.`)
      return
    }

    onFileUpload(file)
    if (event.target) {
      event.target.value = ""
    }
  }

  return (
    <div className="border-2 border-dashed rounded-lg p-4 text-center">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <p>Drag and drop an image here, or click the button below</p>
      {isOperatorSelected ? (
        <>
          <Button 
            onClick={handleUploadClick} 
            className="mt-2"
            disabled={!canUpload}
          >
            Select File
          </Button>
          {!canUpload && timeRemaining > 0 && (
            <p className="text-amber-500 mt-2">
              Rate limit active. Please wait {timeRemaining} seconds before uploading again.
            </p>
          )}
        </>
      ) : (
        <p className="text-red-500 mt-2">
          Please select an operator before uploading an image
        </p>
      )}
      <p className="text-sm text-gray-500 mt-2">
        Max size 100 MB. Limited to one upload every 30 seconds. By proceeding, you agree to our{" "}
        <TermsDialog 
          trigger={
            <button className="text-primary hover:underline">
              terms of use
            </button>
          }
        />
        .
      </p>
    </div>
  )
}
