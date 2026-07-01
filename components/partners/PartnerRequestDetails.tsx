import {
  Calendar,
  Image as ImageIcon,
  MapPin,
  Package,
  Route,
  Users,
  X,
} from 'lucide-react'
import {
  displayDistance,
  displayPartnerDate,
  type PartnerAction,
} from './partnerActions'

interface PartnerRequestDetailsProps {
  action: PartnerAction
  onClose: () => void
  tone: 'donation' | 'disposal'
}

export function PartnerRequestDetails({
  action,
  onClose,
  tone,
}: PartnerRequestDetailsProps) {
  const toneClass =
    tone === 'donation'
      ? 'bg-green-50 text-green-700'
      : 'bg-orange-50 text-orange-700'

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-0 sm:items-center sm:justify-center sm:p-4">
      <section className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${toneClass}`}
            >
              {action.type} request
            </span>
            <h2 className="mt-2 text-2xl font-extrabold text-gray-900">
              {action.name}
            </h2>
            <p className="mt-1 text-sm font-semibold text-gray-500">
              Household {action.householdId.slice(0, 8)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          {action.imageUrl ? (
            <img
              src={action.imageUrl}
              alt={action.imageName || `${action.name} request`}
              className="h-64 w-full object-cover"
            />
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-gray-400">
              <ImageIcon className="h-10 w-10" />
              <p className="mt-2 text-sm font-semibold">
                No image uploaded for this request
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-gray-700">
            <Package className="h-4 w-4 text-gray-400" />
            <span>{action.quantity}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-gray-700">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{displayPartnerDate(action.pickupDate)}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-gray-700">
            <Route className="h-4 w-4 text-gray-400" />
            <span>{displayDistance(action.distanceKm)}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-gray-700">
            <Users className="h-4 w-4 text-gray-400" />
            <span>{action.partner}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-gray-700 sm:col-span-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>
              {action.pickupLocation?.buildingNameNumber ||
                action.pickupLocation?.label ||
                'No pickup location label saved'}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
