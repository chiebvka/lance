import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex h-10 w-full border border-purple-200 dark:border-purple-700 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        search: "pl-10",
        diagonal: "data-[empty=true]:bg-gradient-to-br data-[empty=true]:from-bexoni/5 data-[empty=true]:via-bexoni/10 data-[empty=true]:to-bexoni/5 data-[empty=true]:[background-size:8px_8px] data-[empty=true]:[background-image:repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(0,0,0,0.05)_3px,rgba(0,0,0,0.05)_4px)] data-[empty=false]:bg-background data-[empty=false]:[background-image:none]",
        diagonalReverse: "data-[empty=true]:bg-gradient-to-bl data-[empty=true]:from-bexoni/5 data-[empty=true]:via-bexoni/10 data-[empty=true]:to-bexoni/5 data-[empty=true]:[background-size:8px_8px] data-[empty=true]:[background-image:repeating-linear-gradient(-45deg,transparent,transparent_3px,rgba(0,0,0,0.05)_3px,rgba(0,0,0,0.05)_4px)] data-[empty=false]:bg-background data-[empty=false]:[background-image:none]",
        checkerboard: "data-[empty=true]:bg-gradient-to-br data-[empty=true]:from-bexoni/5 data-[empty=true]:via-bexoni/10 data-[empty=true]:to-bexoni/5 data-[empty=true]:[background-size:8px_8px] data-[empty=true]:[background-image:repeating-conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_90deg,rgba(0,0,0,0.05)_90deg,rgba(0,0,0,0.05)_180deg,transparent_180deg,transparent_270deg,rgba(0,0,0,0.05)_270deg)] data-[empty=false]:bg-background data-[empty=false]:[background-image:none]",
        quantity: "data-[empty=true]:bg-gradient-to-br data-[empty=true]:from-bexoni/5 data-[empty=true]:via-bexoni/10 data-[empty=true]:to-bexoni/5 data-[empty=true]:[background-size:8px_8px] data-[empty=true]:[background-image:repeating-conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_90deg,rgba(0,0,0,0.05)_90deg,rgba(0,0,0,0.05)_180deg,transparent_180deg,transparent_270deg,rgba(0,0,0,0.05)_270deg)] data-[empty=false]:bg-background data-[empty=false]:[background-image:none]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, type, ...props }, ref) => {
    const [isEmpty, setIsEmpty] = React.useState(true);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsEmpty(e.target.value === '');
      props.onChange?.(e);
    };

    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        data-empty={isEmpty}
        onChange={handleInputChange}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
