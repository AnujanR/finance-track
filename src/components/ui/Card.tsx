import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardProps) {
  return <div className={`border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 ${className}`}>{children}</div>
}

export function CardBody({ children, className = '' }: CardProps) {
  return <div className={`p-4 sm:p-6 ${className}`}>{children}</div>
}
