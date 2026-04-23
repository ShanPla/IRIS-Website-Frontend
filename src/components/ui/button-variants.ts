import { cva } from "class-variance-authority";

export const buttonVariants = cva(
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
