'use client'

import { useState, useEffect } from 'react'

export default function ApiInfo() {
  const [apiUrl, setApiUrl] = useState<string>('Loading...')
  const [isForced, setIsForced] = useState<boolean>(false)
  
  useEffect(() => {
    // Get the API URL from environment variable
    let url = process.env.NEXT_PUBLIC_API_URL || 'Not set'
    
    // Check if we're forcing HTTPS
    if (url.startsWith('http://') && window.location.protocol === 'https:') {
      const forcedUrl = url.replace('http://', 'https://')
      setIsForced(true)
      setApiUrl(forcedUrl)
    } else {
      setApiUrl(url)
    }
  }, [])
  
  return (
    <div className="p-4 bg-gray-100 rounded-md my-2 text-sm">
      <h3 className="font-semibold mb-2">API Configuration</h3>
      <p><span className="font-medium">API URL:</span> {apiUrl}</p>
      <p className="text-xs mt-2 text-gray-500">
        {apiUrl.startsWith('https://') 
          ? '✅ Using secure HTTPS connection' 
          : '⚠️ Using insecure HTTP connection'}
      </p>
      {isForced && (
        <p className="text-xs mt-1 text-blue-500">
          ℹ️ HTTPS was automatically enforced for security
        </p>
      )}
    </div>
  )
} 