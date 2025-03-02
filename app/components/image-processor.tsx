"use client"

import { useState, useRef } from "react"
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

// Define type for API error response
interface ApiErrorResponse {
  error: string;
  details?: string;
  exitCode?: number;
}

// Define a simple interface for progress events
interface ProgressEvent {
  loaded: number;
  total?: number;
}

export default function ImageProcessor() {
  const [operator, setOperator] = useState<string>("")
  const [beforeImage, setBeforeImage] = useState<string | null>(null)
  const [afterImage, setAfterImage] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getBackendUrl = () => {
    // Always use the exact URL from environment variable
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;
    console.log("Backend API URL from env:", apiUrl);
    
    if (!apiUrl) {
      console.error("NEXT_PUBLIC_API_URL environment variable is not set!");
      // Use a safe default that doesn't mix domains
      return "https://edgedetectr-lb-2106112805.us-east-1.elb.amazonaws.com";
    }
    
    // Force HTTPS for production to prevent Mixed Content errors
    if (apiUrl.startsWith('http://') && window.location.protocol === 'https:') {
      apiUrl = apiUrl.replace('http://', 'https://');
      console.log("Forced HTTPS for backend URL:", apiUrl);
    }
    
    // Ensure the URL doesn't end with a slash to prevent double slashes
    return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  }

  // POST to this URL with operator in the URL path as expected by backend
  const getApiEndpointUrl = (op: string) => {
    return `${getBackendUrl()}/api/operators/${encodeURIComponent(op)}`;
  }

  const handleFileUpload = async (file: File) => {
    if (!operator) {
      alert("Please select an operator before uploading.")
      return
    }

    // Reset state
    setError(null)
    setProgress(20)
    setStatusMessage("Preparing upload...")
    
    // Log file details
    console.log("Uploading file:", {
      name: file.name,
      size: file.size,
      type: file.type
    })
    
    const formData = new FormData()
    formData.append("file", file)
    // Note: operator should be in URL path, not in form data
    // but we'll keep this for compatibility with backend changes
    formData.append("operator", operator)
    
    // For debugging, log the backend URL and form data contents
    const apiUrl = getApiEndpointUrl(operator);
    console.log("Sending request to:", apiUrl)
    console.log("Selected operator:", operator)
    console.log("File size:", file.size)
    console.log("File type:", file.type)
    
    // Add this debug logging to check if the form data was properly created
    const formDataEntries = Array.from(formData.entries());
    console.log("Form data entries:", formDataEntries.map(entry => {
      if (entry[0] === 'file') {
        return [entry[0], 'File object present'];
      }
      return entry;
    }));

    // Add network status check before sending request
    if (!navigator.onLine) {
      console.error("User is offline - cannot make API request");
      setError("You appear to be offline. Please check your internet connection and try again.");
      setProgress(0);
      setStatusMessage(null);
      return;
    }

    try {
      console.log(`Starting API request to ${apiUrl} at ${new Date().toISOString()}`);
      setProgress(40)
      setStatusMessage("Uploading image...")
      
      // For debugging, log the FormData contents
      // Note: FormData can't be directly logged, so we log the file appended
      console.log("Form data prepared with file:", file.name, "and operator:", operator)
      
      // Create a simple timeout that will trigger an error message if the upload takes too long
      timeoutRef.current = setTimeout(() => {
        console.log("Manual timeout triggered after 20 seconds");
        setError("Connection timed out. The server took too long to respond. Please try again or try a smaller image file.");
        setProgress(0);
        setStatusMessage(null);
      }, 20000);
      
      try {
        const response = await axios.post(
          apiUrl,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            responseType: "text",
            // @ts-ignore - onUploadProgress is available in Axios but may not be in type definitions
            onUploadProgress: (progressEvent: ProgressEvent) => {
              const total = progressEvent.total || 100;
              const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
              setProgress(40 + Math.min(percentCompleted / 2, 40)); // Map to 40-80% of our overall process
              setStatusMessage(`Uploading: ${percentCompleted}%`);
              
              // Reset the timeout with each progress update
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                  console.log("Manual timeout triggered after progress update");
                  setError("Connection timed out. The server took too long to respond. Please try again or try a smaller image file.");
                  setProgress(0);
                  setStatusMessage(null);
                }, 15000);
              }
            }
          }
        );
        
        // Clear the timeout since the request completed successfully
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        console.log("Response received:", response.status, response.statusText)
        console.log("Raw response data:", response.data)
        setProgress(80)
        setStatusMessage("Processing image...")
        
        // Parse the response data
        let responseData
        try {
          responseData = JSON.parse(response.data as string)
          console.log("Parsed response data:", responseData)
        } catch (parseError) {
          console.error("Error parsing response data:", parseError)
          console.log("Raw response data:", response.data)
          throw new Error("Failed to parse server response")
        }
        
        const { inputImage, outputImage } = responseData

        const beforeUrl = `${getBackendUrl()}/uploads/${inputImage}`
        const afterUrl = `${getBackendUrl()}/results/${outputImage}`
        
        // Add cache busting parameter to prevent browser from caching old images
        const cacheParam = `?t=${Date.now()}`
        const beforeUrlWithCache = `${beforeUrl}${cacheParam}`
        const afterUrlWithCache = `${afterUrl}${cacheParam}`
        
        console.log("Setting image URLs:", {
          beforeUrl: beforeUrlWithCache,
          afterUrl: afterUrlWithCache
        })
        
        // Check if the result image actually exists
        const checkImageExists = async (url: string) => {
          try {
            console.log(`Checking if image exists at: ${url}`)
            const response = await fetch(url, { method: 'HEAD' })
            console.log(`Image check response for ${url}:`, response.status)
            return response.status === 200
          } catch (err) {
            console.error(`Error checking image at ${url}:`, err)
            return false
          }
        }
        
        // Attempt to verify the result image exists
        const resultExists = await checkImageExists(afterUrl)
        console.log(`Result image check: ${resultExists ? 'EXISTS' : 'NOT FOUND'}`)
        
        if (!resultExists) {
          console.warn("Result image not found. Trying fallback method...")
          // Wait a moment and try again - sometimes there's a delay in the file being available
          setTimeout(async () => {
            const retryExists = await checkImageExists(afterUrl)
            console.log(`Retry result image check: ${retryExists ? 'EXISTS' : 'STILL NOT FOUND'}`)
            if (retryExists) {
              setAfterImage(afterUrl + '?t=' + new Date().getTime())
            }
          }, 3000)
        }
        
        setBeforeImage(beforeUrlWithCache)
        setAfterImage(afterUrlWithCache)
        setProgress(100)
        setStatusMessage("Complete!")
        
        // Clear status message after a delay
        setTimeout(() => {
          setStatusMessage(null)
        }, 2000)
      } catch (error) {
        // Clear the timeout if there's an error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        console.error("Error processing image:", error)
        
        let errorMessage = "Error processing image. Please try again."
        
        // Extract more detailed error information if available
        // Using type assertion for better TypeScript compatibility
        const err = error as any;

        console.log("Error details:", {
          name: err.name, 
          code: err.code, 
          message: err.message 
        });
        
        // Special handling for timeout errors
        if (err.code === 'ECONNABORTED') {
          console.error("Request timed out after 5 seconds:", {
            url: apiUrl,
            operator,
            fileSize: file.size,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            onlineStatus: navigator.onLine
          });
          errorMessage = "Connection timed out. The server took too long to respond. Please try again or try a smaller image file.";
        } 
        else if (err && err.response) {
          console.error("Axios error details:", {
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data,
            message: err.message
          })
          
          // Use backend error message if available
          if (err.response?.data?.error) {
            errorMessage = `Server error: ${err.response.data.error}`;
            if (err.response.data.details) {
              errorMessage += ` - ${err.response.data.details}`;
            }
          }
        }
        
        setError(errorMessage)
        setProgress(0)
        setStatusMessage(null)
        alert(errorMessage)
      }
    } catch (error) {
      console.error("Error processing image:", error)
      
      let errorMessage = "Error processing image. Please try again."
      
      // Extract more detailed error information if available
      // Using type assertion for better TypeScript compatibility
      const err = error as any;

      console.log("Error details:", {
        name: err.name, 
        code: err.code, 
        message: err.message 
      });
      
      // Special handling for timeout errors
      if (err.code === 'ECONNABORTED') {
        console.error("Request timed out after 5 seconds:", {
          url: apiUrl,
          operator,
          fileSize: file.size,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          onlineStatus: navigator.onLine
        });
        errorMessage = "Connection timed out. The server took too long to respond. Please try again or try a smaller image file.";
      } 
      else if (err && err.response) {
        console.error("Axios error details:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message
        })
        
        // Use backend error message if available
        if (err.response?.data?.error) {
          errorMessage = `Server error: ${err.response.data.error}`;
          if (err.response.data.details) {
            errorMessage += ` - ${err.response.data.details}`;
          }
        }
      }
      
      setError(errorMessage)
      setProgress(0)
      setStatusMessage(null)
      alert(errorMessage)
    }
  }

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'blob'
      })
      
      const blobUrl = window.URL.createObjectURL(new Blob([response.data as BlobPart]))
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
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-[1400px] mx-auto">
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

      {progress > 0 && progress < 100 && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          {statusMessage && <p className="text-sm text-center text-gray-600">{statusMessage}</p>}
        </div>
      )}
    </div>
  )
}

