"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { TermsDialog } from "./terms-dialog"

interface ImageUploadProps {
  onFileUpload: (file: File) => void
  isOperatorSelected: boolean
}

export default function ImageUpload({ onFileUpload, isOperatorSelected }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    if (!isOperatorSelected) {
      alert("Please select an operator before uploading.")
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
        <Button onClick={handleUploadClick} className="mt-2">
          Select File
        </Button>
      ) : (
        <p className="text-red-500 mt-2">
          Please select an operator before uploading an image
        </p>
      )}
      <p className="text-sm text-gray-500 mt-2">
        Max size 100 MB. By proceeding, you agree to our{" "}
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
