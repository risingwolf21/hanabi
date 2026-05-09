import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-indigo-600/20 text-indigo-300',
        secondary: 'bg-slate-700 text-slate-200',
        success: 'bg-green-600/20 text-green-300',
        destructive: 'bg-red-600/20 text-red-300',
        warning: 'bg-yellow-600/20 text-yellow-300',
        outline: 'border border-slate-600 text-slate-300',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
