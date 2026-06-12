declare module 'lucide-react' {
  import * as React from 'react'

  export type LucideProps = React.SVGProps<SVGSVGElement> & {
    size?: string | number
    color?: string
    strokeWidth?: string | number
    absoluteStrokeWidth?: boolean
  }

  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >

  export const ArrowRight: LucideIcon
  export const Bell: LucideIcon
  export const BellRing: LucideIcon
  export const Calendar: LucideIcon
  export const CheckCircle2: LucideIcon
  export const ChevronRight: LucideIcon
  export const Coins: LucideIcon
  export const FileText: LucideIcon
  export const Globe: LucideIcon
  export const HandHeart: LucideIcon
  export const Heart: LucideIcon
  export const Home: LucideIcon
  export const Info: LucideIcon
  export const Leaf: LucideIcon
  export const LogOut: LucideIcon
  export const Mail: LucideIcon
  export const MapPin: LucideIcon
  export const Package: LucideIcon
  export const Recycle: LucideIcon
  export const ScanLine: LucideIcon
  export const Search: LucideIcon
  export const Share2: LucideIcon
  export const Sparkles: LucideIcon
  export const Trash2: LucideIcon
  export const TrendingDown: LucideIcon
  export const Truck: LucideIcon
  export const UploadCloud: LucideIcon
  export const User: LucideIcon
  export const Users: LucideIcon
  export const X: LucideIcon
  export const XCircle: LucideIcon
}
