/**
 * SVG-based payment method logos
 * Replaces heavy PNG files with lightweight SVG alternatives
 * Savings: ~734 KiB
 */

export const PaymentLogos = {
  MPesa: () => (
    <svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="140" fill="#00A651" />
      <circle cx="100" cy="70" r="45" fill="white" />
      <text x="100" y="85" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#00A651" fontFamily="Arial">
        M
      </text>
    </svg>
  ),

  Pesapal: () => (
    <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="100" fill="#2C3E50" />
      <rect x="20" y="20" width="80" height="60" fill="#E8921E" rx="3" />
      <rect x="110" y="20" width="70" height="60" fill="#E8921E" rx="3" />
      <circle cx="60" cy="50" r="12" fill="white" opacity="0.8" />
      <circle cx="145" cy="50" r="12" fill="white" opacity="0.8" />
    </svg>
  ),

  Visa: () => (
    <svg viewBox="0 0 200 124" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="124" fill="#1A1F71" rx="8" />
      <circle cx="160" cy="30" r="18" fill="#EB001B" opacity="0.8" />
      <circle cx="180" cy="50" r="18" fill="#F79E1B" opacity="0.8" />
      <text x="100" y="80" textAnchor="middle" fontSize="32" fontWeight="bold" fill="white" fontFamily="Arial">
        VISA
      </text>
    </svg>
  ),

  Mastercard: () => (
    <svg viewBox="0 0 200 124" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="124" fill="#EBEBEB" rx="8" />
      <circle cx="70" cy="62" r="35" fill="#EB001B" />
      <circle cx="130" cy="62" r="35" fill="#F79E1B" />
      <circle cx="100" cy="62" r="35" fill="none" stroke="#FFFFFF" strokeWidth="8" opacity="0.3" />
    </svg>
  ),

  AirtelMoney: () => (
    <svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="140" fill="#E8383D" />
      <rect x="40" y="30" width="120" height="80" fill="white" rx="5" />
      <text x="100" y="90" textAnchor="middle" fontSize="42" fontWeight="bold" fill="#E8383D" fontFamily="Arial">
        A
      </text>
    </svg>
  ),

  AmericanExpress: () => (
    <svg viewBox="0 0 200 124" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="124" fill="#006FCF" rx="8" />
      <text x="100" y="55" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white" fontFamily="Arial">
        American
      </text>
      <text x="100" y="85" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white" fontFamily="Arial">
        Express
      </text>
    </svg>
  ),
}

/**
 * Payment Logo component that renders SVG-based logos
 * Usage: <PaymentLogo type="mpesa" size="small" />
 */
interface PaymentLogoProps {
  type: "mpesa" | "pesapal" | "visa" | "mastercard" | "airtel" | "amex"
  className?: string
  alt?: string
}

export function PaymentLogo({ type, className = "", alt }: PaymentLogoProps) {
  const logos: Record<string, React.ReactNode> = {
    mpesa: <PaymentLogos.MPesa />,
    pesapal: <PaymentLogos.Pesapal />,
    visa: <PaymentLogos.Visa />,
    mastercard: <PaymentLogos.Mastercard />,
    airtel: <PaymentLogos.AirtelMoney />,
    amex: <PaymentLogos.AmericanExpress />,
  }

  return (
    <div className={className} role="img" aria-label={alt || `${type} logo`}>
      {logos[type]}
    </div>
  )
}
