import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

type AlertVariant = 'default' | 'destructive' | 'warning'

type DialogRequest = {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: AlertVariant
  showCancel?: boolean
}

type AlertContextValue = {
  confirm: (options: DialogRequest) => Promise<boolean>
  alert: (options: Omit<DialogRequest, 'showCancel' | 'cancelLabel'>) => Promise<void>
}

const AlertContext = createContext<AlertContextValue | null>(null)

const confirmButtonClass: Record<AlertVariant, string> = {
  default: '',
  destructive: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500/30',
  warning: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500/30',
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<DialogRequest | null>(null)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const close = useCallback((result: boolean) => {
    setOpen(false)
    resolveRef.current?.(result)
    resolveRef.current = null
  }, [])

  const showDialog = useCallback((request: DialogRequest) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
      setOptions(request)
      setOpen(true)
    })
  }, [])

  const confirm = useCallback(
    (request: DialogRequest) =>
      showDialog({
        cancelLabel: 'Cancel',
        showCancel: true,
        variant: 'default',
        ...request,
      }),
    [showDialog],
  )

  const alert = useCallback(
    (request: Omit<DialogRequest, 'showCancel' | 'cancelLabel'>) =>
      showDialog({
        ...request,
        showCancel: false,
        confirmLabel: request.confirmLabel ?? 'OK',
        variant: request.variant ?? 'default',
      }).then(() => undefined),
    [showDialog],
  )

  const variant = options?.variant ?? 'default'
  const showCancel = options?.showCancel ?? true

  return (
    <AlertContext.Provider value={{ confirm, alert }}>
      {children}
      <AlertDialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) close(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options?.title}</AlertDialogTitle>
            <AlertDialogDescription>{options?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {showCancel && (
              <AlertDialogCancel onClick={() => close(false)}>
                {options?.cancelLabel ?? 'Cancel'}
              </AlertDialogCancel>
            )}
            <AlertDialogAction
              className={cn(confirmButtonClass[variant])}
              onClick={() => close(true)}
            >
              {options?.confirmLabel ?? (showCancel ? 'Confirm' : 'OK')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertContext.Provider>
  )
}

export function useAlert() {
  const ctx = useContext(AlertContext)
  if (!ctx) throw new Error('useAlert must be used within AlertProvider')
  return ctx
}
