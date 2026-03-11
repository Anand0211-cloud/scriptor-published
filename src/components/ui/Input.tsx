import { type InputHTMLAttributes, forwardRef, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    startIcon?: ReactNode;
    endIcon?: ReactNode;
    wrapperClassName?: string;
    variant?: 'default' | 'glass';
    label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, startIcon, endIcon, wrapperClassName, variant = 'default', label, id, ...props }, ref) => {

        const baseStyles = "flex h-10 w-full rounded-lg px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200";

        const variants = {
            default: "border border-gray-200 dark:border-gray-700 bg-white dark:bg-bg-tertiary placeholder:text-gray-500 focus-visible:ring-accent-500/50 focus-visible:border-accent-500 text-gray-900 dark:text-gray-100",
            glass: "bg-gray-100/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:ring-accent-500/30 focus-visible:border-accent-500/50 backdrop-blur-md"
        };

        return (
            <div className={cn("relative w-full space-y-2", wrapperClassName)}>
                {label && (
                    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {startIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none z-10">
                            {startIcon}
                        </div>
                    )}
                    <input
                        id={id}
                        type={type}
                        className={cn(
                            baseStyles,
                            variants[variant],
                            startIcon && "pl-10",
                            endIcon && "pr-10",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {endIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none z-10">
                            {endIcon}
                        </div>
                    )}
                </div>
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
