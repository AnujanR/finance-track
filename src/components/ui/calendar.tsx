import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, getDefaultClassNames } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const defaults = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        root: cn('w-fit', defaults.root),
        months: cn('relative flex flex-col gap-4 sm:flex-row', defaults.months),
        month: cn('flex w-full flex-col gap-4', defaults.month),
        month_caption: cn('relative flex h-8 items-center justify-center', defaults.month_caption),
        caption_label: cn('text-sm font-medium text-slate-900', defaults.caption_label),
        nav: cn('absolute inset-x-0 top-0 flex items-center justify-between', defaults.nav),
        button_previous: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'h-8 w-8 text-slate-600',
          defaults.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'h-8 w-8 text-slate-600',
          defaults.button_next,
        ),
        month_grid: cn('w-full border-collapse', defaults.month_grid),
        weekdays: cn('flex', defaults.weekdays),
        weekday: cn('w-9 text-center text-xs font-medium text-slate-500', defaults.weekday),
        week: cn('mt-1 flex w-full', defaults.week),
        day: cn('relative p-0 text-center', defaults.day),
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal text-slate-900 hover:bg-slate-100 aria-selected:opacity-100',
          defaults.day_button,
        ),
        selected: cn(
          'bg-brand-600 text-white hover:bg-brand-600 hover:text-white focus:bg-brand-600 focus:text-white',
          defaults.selected,
        ),
        today: cn('bg-slate-100 text-slate-900', defaults.today),
        outside: cn('text-slate-400 opacity-50', defaults.outside),
        disabled: cn('text-slate-400 opacity-50', defaults.disabled),
        hidden: cn('invisible', defaults.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...chevronProps }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight
          return <Icon className={cn('h-4 w-4', className)} {...chevronProps} />
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
