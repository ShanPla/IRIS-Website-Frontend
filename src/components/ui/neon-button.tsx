import React from 'react'
import { cn } from '../../lib/utils'
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "./button-variants";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> { neon?: boolean }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, neon = true, size, variant, children, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size }), className)}
                ref={ref}
                {...props}
            >
                {/* Neon Top Shine */}
                <span className={cn(
                    "absolute top-0 h-px opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out inset-x-0 bg-gradient-to-r w-3/4 mx-auto from-transparent via-blue-400 to-transparent z-10",
                    neon ? "block" : "hidden"
                )} />
                
                <span className="relative z-10">{children}</span>

                {/* Neon Bottom Glow Line */}
                <span className={cn(
                    "absolute -bottom-px h-px opacity-0 group-hover:opacity-100 transition-all duration-700 ease-in-out inset-x-0 bg-gradient-to-r w-2/3 mx-auto from-transparent via-blue-400/80 to-transparent z-10",
                    neon ? "block" : "hidden"
                )} />

                {/* Outer Ambient Glow */}
                <span className={cn(
                    "absolute inset-0 rounded-full bg-blue-500/0 group-hover:bg-blue-500/5 transition-all duration-500 -z-10 blur-md",
                    neon ? "block" : "hidden"
                )} />
            </button>
        );
    }
)

Button.displayName = 'Button';

export { Button };
