import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('p-4 sm:p-6 lg:p-8', className)}>{children}</div>
}

export function PageHeader({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PageHeaderActions({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('flex flex-wrap gap-2', className)}>{children}</div>
}
