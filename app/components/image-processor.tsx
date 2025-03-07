"use client"

import { useState, useRef, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import ImageUpload from "./image-upload"
import ImageDisplay from "./image-display"
import axios from "axios"
import { getBackendUrl, getApiEndpointUrl } from "@/lib/api-utils"

const operators = [
  "opencv sobel",
  "alternative sobel",
  "openmp sobel",
  "prewitt",
  "roberts cross",
]

interface ApiErrorResponse {
  error: string;
  details?: string;
  exitCode?: number;
}

interface ProgressEvent {
  loaded: number;
  total?: number;
}

const RATE_LIMIT_WINDOW = 30;

interface UploadProgressEvent {
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
  const [canUpload, setCanUpload] = useState<boolean>(true)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkUploadAvailability = () => {
      const lastUploadTime = localStorage.getItem('lastUploadTime');
      
      if (lastUploadTime) {
        const elapsedSeconds = Math.floor((Date.now() - parseInt(lastUploadTime)) / 1000);
        
        if (elapsedSeconds < RATE_LIMIT_WINDOW) {
          setCanUpload(false);
          const remaining = RATE_LIMIT_WINDOW - elapsedSeconds;
          setTimeRemaining(remaining);
          
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
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!operator) {
      alert("Please select an operator before uploading.")
      return
    }
    
    let apiUrl = getApiEndpointUrl(operator);
    if (!apiUrl) {
      setError("Server configuration error: API URL is not set. Please contact the administrator.");
      return;
    }
    
    if (!canUpload) {
      setError(`Rate limit exceeded. Please wait ${timeRemaining} seconds before uploading another image.`);
      return;
    }

    setError(null)
    setProgress(20)
    setStatusMessage("Preparing upload...")
    
    const userAgent = window.navigator.userAgent;
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isFirefox = /Firefox/i.test(userAgent);
    const isChrome = /Chrome/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);

    // console.log('Browser Info:', {
    //   userAgent,
    //   isSafari,
    //   isFirefox,
    //   isChrome,
    //   isIOS
    // });

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

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        ctx.drawImage(img, 0, 0, width, height);
        
        processedFile = new File(
          [await new Promise<Blob>(resolve => canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.9))],
          file.name.replace(/\.[^/.]+$/, '') + '.jpg',
          { type: 'image/jpeg' }
        );

        URL.revokeObjectURL(img.src);
      } catch (error) {
        console.error('Image processing error:', error);
        processedFile = file;
      }
    }
    
    const formData = new FormData()
    formData.append("file", processedFile)
    formData.append("operator", operator)
    
    // console.log("Sending request to:", apiUrl)
    // console.log("Selected operator:", operator)
    // console.log("File size:", processedFile.size)
    // console.log("File type:", processedFile.type)
    
    try {
      // console.log(`Starting API request to ${apiUrl} at ${new Date().toISOString()}`);
      setProgress(40)
      setStatusMessage("Uploading image...")
      
      const axiosConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        withCredentials: false,
        timeout: 30000,
      } as any;  // Type assertion to avoid TypeScript errors
      
      // Use a more targeted approach for bypassing SSL certificate validation
      // This is specifically for the AWS load balancer URLs which have certificate issues
      if (apiUrl.includes('elb.amazonaws.com')) {
        // console.log("AWS load balancer detected, bypassing SSL verification and using custom domain instead");
        // Replace the API URL with the custom domain that has valid SSL
        const customDomainUrl = `https://api.edgedetectr.com/api/operators/${encodeURIComponent(operator)}`;
        // console.log("Redirecting request to custom domain:", customDomainUrl);
        apiUrl = customDomainUrl;
      }

      let response;
      try {
        response = await axios.post(apiUrl, formData, {
          ...axiosConfig,
          onUploadProgress: (progressEvent: any) => {
            const total = progressEvent.total || 100;
            const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
            setProgress(40 + Math.min(percentCompleted / 2, 40));
            setStatusMessage(`Uploading: ${percentCompleted}%`);
          }
        });
      } catch (axiosError: any) {
        console.error('Axios request failed:', axiosError);
        
        const apiUrlObj = new URL(apiUrl);
        
        // console.log("Network error detected - retrying with fetch API");
        
        try {
          response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
            mode: 'cors',
            credentials: 'omit', // Don't include credentials to simplify CORS requests
            headers: {
              'Accept': 'application/json',
            },
          });
        } catch (fetchError) {
          console.error('Fetch request failed:', fetchError);
          throw new Error('Failed to upload image. Please try again.');
        }
      }

      const responseData = response instanceof Response ? await response.json() : response.data;
      const status = response instanceof Response ? response.status : response.status;
      const statusText = response instanceof Response ? response.statusText : response.statusText;

      if (status !== 200) {
        console.error('Server response:', {
          status,
          statusText,
          responseData
        });

        if (status === 0) {
          throw new Error('Network Error: Unable to connect to the server. This might be due to CORS or SSL issues.');
        }
        
        if (status === 401) {
          throw new Error('Authentication Error: Please log in again.');
        }

        if (status === 413) {
          throw new Error('File too large: Please upload a smaller image.');
        }

        throw new Error(responseData?.message || `Server error: ${status} ${statusText}`);
      }

      // console.log("Response received:", status, statusText);
      setProgress(80)
      setStatusMessage("Processing image...")
      
      const { inputImage, outputImage } = responseData;

      const beforeUrl = `${getBackendUrl()}/uploads/${inputImage}`
      const afterUrl = `${getBackendUrl()}/results/${outputImage}`
      
      const cacheParam = `?t=${Date.now()}`
      const beforeUrlWithCache = `${beforeUrl}${cacheParam}`
      const afterUrlWithCache = `${afterUrl}${cacheParam}`
      
      // console.log("Setting image URLs:", {
      //   beforeUrl: beforeUrlWithCache,
      //   afterUrl: afterUrlWithCache
      // })
      
      const checkImageExists = async (url: string) => {
        try {
          // console.log(`Checking if image exists at: ${url}`)
          const response = await fetch(url, { 
            method: 'HEAD',
            mode: 'cors',
            credentials: 'include'
          })
          // console.log(`Image check response for ${url}:`, response.status)
          return response.status === 200
        } catch (err) {
          console.error(`Error checking image at ${url}:`, err)
          return false
        }
      }
      
      const resultExists = await checkImageExists(afterUrl)
      // console.log(`Result image check: ${resultExists ? 'EXISTS' : 'NOT FOUND'}`)
      
      if (!resultExists) {
        console.warn("Result image not found. Trying fallback method...")
        setTimeout(async () => {
          const retryExists = await checkImageExists(afterUrl)
          // console.log(`Retry result image check: ${retryExists ? 'EXISTS' : 'STILL NOT FOUND'}`)
          if (retryExists) {
            setAfterImage(afterUrl + '?t=' + new Date().getTime())
          }
        }, 3000)
      }
      
      setBeforeImage(beforeUrlWithCache)
      setAfterImage(afterUrlWithCache)
      setProgress(100)
      setStatusMessage("Complete!")
      
      setTimeout(() => {
        setStatusMessage(null)
      }, 2000)
    } catch (error) {
      console.error("Error processing image:", error)
      
      let errorMessage = "Error processing image. Please try again."
      const err = error as any;

      // console.log("Error details:", {
      //   name: err.name, 
      //   code: err.code, 
      //   message: err.message 
      // });
      
      if (err.code === 'ERR_CERT_AUTHORITY_INVALID' || 
          err.message?.includes('certificate') || 
          err.message?.includes('SSL')) {
        errorMessage = "SSL Certificate Error: The server's security certificate is not properly configured. Please contact the administrator.";
      }
      else if (err.code === 'ERR_NETWORK') {
        errorMessage = "Network Error: Unable to connect to the server. Please check your internet connection and try again.";
      }
      else if (err.code === 'ECONNABORTED') {
        errorMessage = "Connection timed out. The server took too long to respond. Please try again or try a smaller image file.";
      }
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
        <SelectTrigger className="w-[180px]" aria-label="Select edge detection operator">
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

