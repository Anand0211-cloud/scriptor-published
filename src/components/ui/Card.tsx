import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'outline';
    hoverEffect?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', hoverEffect = false, ...props }, ref) => {
        const variants = {
            default: "bg-white dark:bg-bg-secondary border border-gray-200 dark:border-gray-800 shadow-sm",
            glass: "bg-white/10 dark:bg-gray-900/40 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl",
            outline: "bg-transparent border border-gray-200 dark:border-gray-800"
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-xl transition-all duration-300",
                    variants[variant],
                    hoverEffect && "hover:translate-y-[-4px] hover:shadow-lg hover:border-accent-500/30",
                    className
                )}
                {...props}
            />
        );
    }
);
Card.displayName = "Card";

export { Card };
