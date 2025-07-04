'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { MapPin, Upload, CheckCircle, Loader, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { StandaloneSearchBox, useJsApiLoader } from '@react-google-maps/api'
import { Libraries } from '@react-google-maps/api'
import { createUser, getUserByEmail, createReport, getRecentReports } from '@/utils/db/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

// Types
interface User {
  id: number
  email: string
  name: string
}

interface Report {
  id: number
  location: string
  wasteType: string
  amount: string
  createdAt: string
}

interface VerificationResult {
  wasteType: string
  quantity: string
  confidence: number
}

interface NewReport {
  location: string
  type: string
  amount: string
}

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'failure'

// Constants
const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const libraries: Libraries = ['places']

// Custom hooks
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const email = localStorage.getItem('userEmail')
        if (email) {
          let user = await getUserByEmail(email)
          if (!user) {
            user = await createUser(email, 'Anonymous User')
          }
          setUser(user)
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error checking user:', error)
        toast.error('Failed to authenticate user')
      } finally {
        setLoading(false)
      }
    }
    checkUser()
  }, [router])

  return { user, loading }
}

const useReports = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = useCallback(async () => {
    try {
      const recentReports = await getRecentReports()
      const formattedReports = recentReports.map(report => ({
        ...report,
        createdAt: report.createdAt.toISOString().split('T')[0]
      }))
      setReports(formattedReports)
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [])

  const addReport = useCallback((newReport: Report) => {
    setReports(prev => [newReport, ...prev])
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  return { reports, loading, addReport, refetch: fetchReports }
}

// Components
const FileUpload = ({ 
  file, 
  preview, 
  onFileChange, 
  onRemove 
}: {
  file: File | null
  preview: string | null
  onFileChange: (file: File | null) => void
  onRemove: () => void
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    onFileChange(selectedFile)
  }

  const handleRemove = () => {
    onRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="mb-8">
      <label htmlFor="waste-image" className="block text-lg font-medium text-gray-700 mb-2">
        Upload Waste Image
      </label>
      
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Waste preview" 
            className="max-w-full h-auto rounded-xl shadow-md max-h-96 object-contain mx-auto"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-green-500 transition-colors duration-300">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="waste-image"
                className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500"
              >
                <span>Upload a file</span>
                <input 
                  ref={fileInputRef}
                  id="waste-image" 
                  name="waste-image" 
                  type="file" 
                  className="sr-only" 
                  onChange={handleFileChange} 
                  accept="image/*" 
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
      )}
    </div>
  )
}

const VerificationResult = ({ 
  status, 
  result, 
  onRetry 
}: {
  status: VerificationStatus
  result: VerificationResult | null
  onRetry: () => void
}) => {
  if (status === 'success' && result) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-8 rounded-r-xl">
        <div className="flex items-center">
          <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-green-800">Verification Successful</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Waste Type: {result.wasteType}</p>
              <p>Quantity: {result.quantity}</p>
              <p>Confidence: {(result.confidence * 100).toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'failure') {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded-r-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-400 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Verification Failed</h3>
              <p className="text-sm text-red-700">Please try again with a clearer image</p>
            </div>
          </div>
          <Button 
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return null
}

const ReportsTable = ({ reports, loading }: { reports: Report[]; loading: boolean }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No reports found. Submit your first waste report!</p>
      </div>
    )
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      <table className="w-full">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {reports.map((report) => (
            <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-200">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <MapPin className="inline-block w-4 h-4 mr-2 text-green-500" />
                {report.location}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.wasteType}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.amount}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Main component
export default function ReportPage() {
  const { user, loading: authLoading } = useAuth()
  const { reports, loading: reportsLoading, addReport } = useReports()
  
  const [newReport, setNewReport] = useState<NewReport>({
    location: '',
    type: '',
    amount: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey!,
    libraries: libraries
  })

  const onLoad = useCallback((ref: google.maps.places.SearchBox) => {
    setSearchBox(ref)
  }, [])

  const onPlacesChanged = useCallback(() => {
    if (searchBox) {
      const places = searchBox.getPlaces()
      if (places && places.length > 0) {
        const place = places[0]
        setNewReport(prev => ({
          ...prev,
          location: place.formatted_address || '',
        }))
      }
    }
  }, [searchBox])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewReport(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleFileChange = useCallback((selectedFile: File | null) => {
    setFile(selectedFile)
    setVerificationStatus('idle')
    setVerificationResult(null)
    
    if (selectedFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }, [])

  const handleRemoveFile = useCallback(() => {
    setFile(null)
    setPreview(null)
    setVerificationStatus('idle')
    setVerificationResult(null)
    setNewReport(prev => ({ ...prev, type: '', amount: '' }))
  }, [])

  const readFileAsBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [])

  const handleVerify = useCallback(async () => {
    if (!file || !geminiApiKey) return

    setVerificationStatus('verifying')
    
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const base64Data = await readFileAsBase64(file)

      const imageParts = [{
        inlineData: {
          data: base64Data.split(',')[1],
          mimeType: file.type,
        },
      }]

      const prompt = `You are an expert in waste management and recycling. Analyze this image and provide:
        1. The type of waste (e.g., plastic, paper, glass, metal, organic)
        2. An estimate of the quantity or amount (in kg or liters)
        3. Your confidence level in this assessment (as a percentage)
        
        Return your response as a JSON object with this exact structure:
        {
          "wasteType": "type of waste",
          "quantity": "estimated quantity with unit",
          "confidence": confidence level as a number between 0 and 1
        }
        
        CRITICAL INSTRUCTIONS:
        - Return ONLY the JSON object
        - NO markdown formatting
        - NO code blocks or backticks
        - NO additional text or explanations
        - NO bold text or asterisks
        - Start your response directly with the opening brace {
        - End your response with the closing brace }
        
        Example format:
        {"wasteType": "plastic bottles", "quantity": "2 kg", "confidence": 0.8}`

      const result = await model.generateContent([prompt, ...imageParts])
      const response = await result.response
      const text = response.text()
      
      try {
        // Clean the response text to handle markdown formatting
        const cleanedText = text
          .replace(/```json\n?/g, '') // Remove opening code fences
          .replace(/```\n?/g, '')     // Remove closing code fences
          .replace(/^\*\*.*?\*\*$/gm, '') // Remove any markdown bold text
          .trim()
        
        console.log('Raw response:', text)
        console.log('Cleaned response:', cleanedText)
        
        const parsedResult = JSON.parse(cleanedText)
        if (parsedResult.wasteType && parsedResult.quantity && typeof parsedResult.confidence === 'number') {
          setVerificationResult(parsedResult)
          setVerificationStatus('success')
          setNewReport(prev => ({
            ...prev,
            type: parsedResult.wasteType,
            amount: parsedResult.quantity
          }))
        } else {
          throw new Error('Invalid verification result structure')
        }
      } catch (error) {
        console.error('Failed to parse JSON response:', text)
        setVerificationStatus('failure')
        toast.error('Failed to verify waste. Please try again.')
      }
    } catch (error) {
      console.error('Error verifying waste:', error)
      setVerificationStatus('failure')
      toast.error('Failed to verify waste. Please try again.')
    }
  }, [file, geminiApiKey, readFileAsBase64])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (verificationStatus !== 'success' || !user) {
      toast.error('Please verify the waste before submitting or log in.')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const report = await createReport(
        user.id,
        newReport.location,
        newReport.type,
        newReport.amount,
        preview || undefined,
        verificationResult ? JSON.stringify(verificationResult) : undefined
      ) as any
      
      const formattedReport: Report = {
        id: report.id,
        location: report.location,
        wasteType: report.wasteType,
        amount: report.amount,
        createdAt: report.createdAt.toISOString().split('T')[0]
      }
      
      addReport(formattedReport)
      
      // Reset form
      setNewReport({ location: '', type: '', amount: '' })
      setFile(null)
      setPreview(null)
      setVerificationStatus('idle')
      setVerificationResult(null)
      
      toast.success('Report submitted successfully! You\'ve earned points for reporting waste.')
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [verificationStatus, user, newReport, preview, verificationResult, addReport])

  const handleRetryVerification = useCallback(() => {
    setVerificationStatus('idle')
    setVerificationResult(null)
  }, [])

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">Report Waste</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg mb-12">
        <FileUpload 
          file={file}
          preview={preview}
          onFileChange={handleFileChange}
          onRemove={handleRemoveFile}
        />
        
        <Button 
          type="button" 
          onClick={handleVerify} 
          className="w-full mb-8 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg rounded-xl transition-colors duration-300" 
          disabled={!file || verificationStatus === 'verifying'}
        >
          {verificationStatus === 'verifying' ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Verifying...
            </>
          ) : 'Verify Waste'}
        </Button>

        <VerificationResult 
          status={verificationStatus}
          result={verificationResult}
          onRetry={handleRetryVerification}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            {isLoaded ? (
              <StandaloneSearchBox
                onLoad={onLoad}
                onPlacesChanged={onPlacesChanged}
              >
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={newReport.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                  placeholder="Enter waste location"
                />
              </StandaloneSearchBox>
            ) : (
              <input
                type="text"
                id="location"
                name="location"
                value={newReport.location}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                placeholder="Enter waste location"
              />
            )}
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Waste Type
            </label>
            <input
              type="text"
              id="type"
              name="type"
              value={newReport.type}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
              placeholder="Verified waste type"
              readOnly
            />
          </div>
          
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Amount
            </label>
            <input
              type="text"
              id="amount"
              name="amount"
              value={newReport.amount}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
              placeholder="Verified amount"
              readOnly
            />
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg rounded-xl transition-colors duration-300 flex items-center justify-center"
          disabled={isSubmitting || verificationStatus !== 'success'}
        >
          {isSubmitting ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Submitting...
            </>
          ) : 'Submit Report'}
        </Button>
      </form>

      <h2 className="text-3xl font-semibold mb-6 text-gray-800">Recent Reports</h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <ReportsTable reports={reports} loading={reportsLoading} />
      </div>
    </div>
  )
}