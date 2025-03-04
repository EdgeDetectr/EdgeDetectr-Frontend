"use client"

import { useState, useRef, useEffect } from "react"
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

// Rate limiting constants
const RATE_LIMIT_WINDOW = 30; // 30 seconds

export default function ImageProcessor() {
  const [operator, setOperator] = useState<string>("")
  const [beforeImage, setBeforeImage] = useState<string | null>(null)
  const [afterImage, setAfterImage] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [canUpload, setCanUpload] = useState<boolean>(true)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check localStorage for last upload time and update canUpload state
  useEffect(() => {
    const checkUploadAvailability = () => {
      const lastUploadTime = localStorage.getItem('lastUploadTime');
      
      if (lastUploadTime) {
        const elapsedSeconds = Math.floor((Date.now() - parseInt(lastUploadTime)) / 1000);
        
        if (elapsedSeconds < RATE_LIMIT_WINDOW) {
          setCanUpload(false);
          const remaining = RATE_LIMIT_WINDOW - elapsedSeconds;
          setTimeRemaining(remaining);
          
          // Start countdown timer
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          
          timerRef.current = setInterval(() => {
            setTimeRemaining(prev => {
              if (prev <= 1) {
                setCanUpload(true);
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                  timerRef.current = null;
                }
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setCanUpload(true);
        }
      } else {
        setCanUpload(true);
      }
    };
    
    checkUploadAvailability();
    
    // Cleanup interval on component unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const getBackendUrl = () => {
    // Always use the exact URL from environment variable
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;
    console.log("Backend API URL from env:", apiUrl);
    
    if (!apiUrl) {
      console.error("NEXT_PUBLIC_API_URL environment variable is not set!");
      // Return empty string and handle the error in the UI
      return "";
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
    const baseUrl = getBackendUrl();
    if (!baseUrl) {
      return "";
    }
    return `${baseUrl}/api/operators/${encodeURIComponent(op)}`;
  }

  const handleFileUpload = async (file: File) => {
    if (!operator) {
      alert("Please select an operator before uploading.")
      return
    }
    
    // Check if the API URL is configured
    const apiUrl = getApiEndpointUrl(operator);
    if (!apiUrl) {
      setError("Server configuration error: API URL is not set. Please contact the administrator.");
      return;
    }
    
    // Check if upload is allowed based on rate limiting
    if (!canUpload) {
      setError(`Rate limit exceeded. Please wait ${timeRemaining} seconds before uploading another image.`);
      return;
    }

    // Reset state
    setError(null)
    setProgress(20)
    setStatusMessage("Preparing upload...")
    
    // Detect browser and platform
    const userAgent = window.navigator.userAgent;
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isFirefox = /Firefox/i.test(userAgent);
    const isChrome = /Chrome/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);

    // Log browser information for debugging
    console.log('Browser Info:', {
      userAgent,
      isSafari,
      isFirefox,
      isChrome,
      isIOS
    });

    // Process image for Safari and iOS
    let processedFile = file;
    if (isSafari || isIOS) {
      try {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        // Calculate dimensions maintaining aspect ratio
        const maxDimension = 2048;
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        // Fill with white background to handle transparency
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with higher quality
        processedFile = new File(
          [await new Promise<Blob>(resolve => canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.9))],
          file.name.replace(/\.[^/.]+$/, '') + '.jpg',
          { type: 'image/jpeg' }
        );

        URL.revokeObjectURL(img.src);
      } catch (error) {
        console.error('Image processing error:', error);
        // Continue with original file if processing fails
      }
    }
    
    const formData = new FormData()
    formData.append("file", processedFile)
    formData.append("operator", operator)
    
    // For debugging, log the backend URL and form data contents
    console.log("Sending request to:", apiUrl)
    console.log("Selected operator:", operator)
    console.log("File size:", processedFile.size)
    console.log("File type:", processedFile.type)
    
    try {
      console.log(`Starting API request to ${apiUrl} at ${new Date().toISOString()}`);
      setProgress(40)
      setStatusMessage("Uploading image...")
      
      // Try fetch first
      let response;
      try {
        // First try with credentials
        response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });
      } catch (fetchError) {
        console.log('Fetch with credentials failed, trying without credentials:', fetchError);
        try {
          // Try without credentials
          response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
            mode: 'cors',
            credentials: 'omit',
            headers: {
              'Accept': 'application/json',
            },
          });
        } catch (fetchError2) {
          console.log('Fetch without credentials failed, trying axios as fallback:', fetchError2);
          // Fallback to axios with specific configuration for Firefox
          response = await axios.post(apiUrl, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Accept': 'application/json',
            },
            withCredentials: false, // Disable credentials for Firefox
            timeout: 30000,
            // @ts-ignore - onUploadProgress is available in Axios but may not be in type definitions
            onUploadProgress: (progressEvent: ProgressEvent) => {
              const total = progressEvent.total || 100;
              const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
              setProgress(40 + Math.min(percentCompleted / 2, 40));
              setStatusMessage(`Uploading: ${percentCompleted}%`);
            }
          });
        }
      }

      // Handle response based on whether we used fetch or axios
      const responseData = response instanceof Response ? await response.json() : response.data;
      const status = response instanceof Response ? response.status : response.status;
      const statusText = response instanceof Response ? response.statusText : response.statusText;

      if (status !== 200) {
        console.error('Server response:', {
          status,
          statusText,
          responseData
        });

        // Handle specific error cases
        if (status === 0) {
          throw new Error('Network Error: Unable to connect to the server. This might be due to CORS or SSL issues. Please try using Chrome or ensure the server is properly configured.');
        }
        
        if (status === 401) {
          throw new Error('Authentication Error: Please log in again.');
        }

        if (status === 413) {
          throw new Error('File too large: Please upload a smaller image.');
        }

        throw new Error(responseData?.message || `Server error: ${status} ${statusText}`);
      }

      console.log("Response received:", status, statusText);
      setProgress(80)
      setStatusMessage("Processing image...")
      
      const { inputImage, outputImage } = responseData;

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
          const response = await fetch(url, { 
            method: 'HEAD',
            mode: 'cors',
            credentials: 'include'
          })
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
      console.error("Error processing image:", error)
      
      let errorMessage = "Error processing image. Please try again."
      const err = error as any;

      console.log("Error details:", {
        name: err.name, 
        code: err.code, 
        message: err.message 
      });
      
      // Handle SSL certificate errors
      if (err.code === 'ERR_CERT_AUTHORITY_INVALID' || 
          err.message?.includes('certificate') || 
          err.message?.includes('SSL')) {
        errorMessage = "SSL Certificate Error: The server's security certificate is not properly configured. Please contact the administrator.";
      }
      // Handle network errors
      else if (err.code === 'ERR_NETWORK') {
        errorMessage = "Network Error: Unable to connect to the server. Please check your internet connection and try again.";
      }
      // Handle timeout errors
      else if (err.code === 'ECONNABORTED') {
        errorMessage = "Connection timed out. The server took too long to respond. Please try again or try a smaller image file.";
      }
      // Handle server errors
      else if (err.response) {
        errorMessage = `Server error: ${err.response.data?.error || err.response.statusText}`;
        if (err.response.data?.details) {
          errorMessage += ` - ${err.response.data.details}`;
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
        canUpload={canUpload}
        timeRemaining={timeRemaining} 
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

