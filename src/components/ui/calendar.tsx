import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, getDefaultClassNames, type DayButtonProps } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function CalendarDayButton({ className, day, modifiers, ...props }: DayButtonProps) {
  const defaultClassNames = getDefaultClassNames()
  const ref = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      className={cn(
        'h-9 w-9 p-0 font-normal text-slate-900 hover:bg-slate-100',
        'data-[selected-single=true]:bg-brand-600 data-[selected-single=true]:text-white data-[selected-single=true]:hover:bg-brand-600 data-[selected-single=true]:hover:text-white',
        modifiers.today && !modifiers.selected && 'bg-slate-100',
        modifiers.outside && 'text-slate-400 opacity-50',
        modifiers.disabled && 'pointer-events-none text-slate-400 opacity-50',
        defaultClassNames.day_button,
        className,
      )}
      {...props}
    />
  )
}

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('relative flex flex-col gap-4', defaultClassNames.months),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        month_caption: cn(
          'relative flex h-9 items-center justify-center px-9',
          defaultClassNames.month_caption,
        ),
        caption_label: cn('text-sm font-medium text-slate-900', defaultClassNames.caption_label),
        nav: cn('absolute inset-x-0 top-0 flex items-center justify-between', defaultClassNames.nav),
        button_previous: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'h-9 w-9 text-slate-600',
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'h-9 w-9 text-slate-600',
          defaultClassNames.button_next,
        ),
        month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn('w-9 text-center text-xs font-medium text-slate-500', defaultClassNames.weekday),
        week: cn('mt-1 flex w-full', defaultClassNames.week),
        day: cn('relative p-0 text-center', defaultClassNames.day),
        outside: cn('text-slate-400 opacity-50', defaultClassNames.outside),
        disabled: cn('text-slate-400 opacity-50', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...rootProps }) => (
          <div data-slot="calendar" ref={rootRef} className={cn(className)} {...rootProps} />
        ),
        Chevron: ({ orientation, className, ...chevronProps }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight
          return <Icon className={cn('h-4 w-4', className)} {...chevronProps} />
        },
        DayButton: CalendarDayButton,
      }}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
