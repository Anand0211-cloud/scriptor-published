import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils'; // Assuming utils exists, if not I'll create it later.

// If cn utility doesn't exist, I will create it. 
// For now, I'll assume standard shadcn-like structure or just use clsx/tailwind-merge directly if utils is missing. 
// Checking previous file list, I saw `lib/supabase.ts`. I didn't see `utils.ts`. 
// I will create `lib/utils.ts` in the next step if needed. 
// For safety, I'll inline the class merging here or create the utils file immediately after.
// Actually, `script-1/package.json` had `clsx` and `tailwind-merge`.

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
    {
        variants: {
            variant: {
                primary:
                    "bg-gradient-to-r from-accent-600 to-accent-500 text-white shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 hover:from-accent-500 hover:to-accent-400 border border-transparent",
                secondary:
                    "bg-gray-100 dark:bg-bg-tertiary text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm",
                outline:
                    "border border-gray-200 dark:border-gray-700 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100",
                ghost:
                    "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white",
                danger:
                    "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20",
                glass:
                    "bg-gray-100/50 dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 shadow-lg"
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, isLoading, children, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
