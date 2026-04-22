import React from 'react'
import { cn } from '../../lib/utils'
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
    "relative group border text-foreground mx-auto text-center rounded-full transition-all duration-300 active:scale-[0.97] active:duration-75",
    {
        variants: {
            variant: {
                default: "bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.15)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] active:bg-blue-500/20 active:border-blue-400",
                solid: "bg-blue-600 hover:bg-blue-500 text-white border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] active:brightness-125 transition-all duration-200",
                ghost: "border-transparent bg-transparent hover:border-zinc-600 hover:bg-white/10 active:bg-white/20",
            },
            size: {
                default: "px-7 py-2",
                sm: "px-4 py-1",
                lg: "px-10 py-3",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

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

export { Button, buttonVariants };
