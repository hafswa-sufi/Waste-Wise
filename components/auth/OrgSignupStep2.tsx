import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, UploadCloud, Info } from 'lucide-react'

const UploadCloudIcon = UploadCloud as unknown as React.ComponentType<
  React.SVGProps<SVGSVGElement>
>
const InfoIcon = Info as unknown as React.ComponentType<
  React.SVGProps<SVGSVGElement>
>

interface OrgSignupStep2Props {
  onSubmit: (certificateFileName: string) => void
  onBack: () => void
}
export function OrgSignupStep2({ onSubmit, onBack }: OrgSignupStep2Props) {
  const [certificateFileName, setCertificateFileName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(certificateFileName)
  }
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-wastewise-green"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Partner Registration
        </h2>
        <p className="text-gray-500 mt-2">
          Step 2 of 2: Verification Documents
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Certificate of Registration
            </label>
            <label className="block border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:bg-gray-50 hover:border-wastewise-green transition-colors cursor-pointer group">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-100 transition-colors">
                <UploadCloudIcon className="w-8 h-8 text-wastewise-green" />
              </div>
              <p className="text-gray-900 font-bold text-lg mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-gray-500 text-sm">
                PDF, JPG, or PNG (max. 5MB)
              </p>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg"
                className="sr-only"
                onChange={(event) =>
                  setCertificateFileName(event.target.files?.[0]?.name ?? '')
                }
              />
            </label>
            {certificateFileName && (
              <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                Selected: {certificateFileName}
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 mb-8">
            <InfoIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 font-medium leading-relaxed">
              To ensure the safety and trust of our community, all partner
              accounts are manually verified. Your account will be reviewed
              within 48 hours of submission.
            </p>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="px-8 py-3.5 bg-wastewise-green text-white rounded-xl font-bold text-lg hover:bg-green-800 transition-colors shadow-sm"
            >
              Submit for Review
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
