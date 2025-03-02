'use client'

import { useState, useEffect } from 'react'

export default function ApiInfo() {
  const [apiUrl, setApiUrl] = useState<string>('Loading...')
  
  useEffect(() => {
    // Get the API URL from environment variable
    const url = process.env.NEXT_PUBLIC_API_URL || 'Not set'
    setApiUrl(url)
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
    </div>
  )
} 