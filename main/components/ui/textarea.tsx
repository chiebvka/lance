import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex min-h-[100px] w-full border border-purple-200 dark:border-purple-700 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "",
        diagonal: "data-[empty=true]:bg-gradient-to-br data-[empty=true]:from-bexoni/5 data-[empty=true]:via-bexoni/10 data-[empty=true]:to-bexoni/5 data-[empty=true]:[background-size:8px_8px] data-[empty=true]:[background-image:repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(0,0,0,0.05)_3px,rgba(0,0,0,0.05)_4px)] focus-within:bg-background focus-within:[background-image:none]",
        diagonalReverse: "data-[empty=true]:bg-gradient-to-bl data-[empty=true]:from-bexoni/5 data-[empty=true]:via-bexoni/10 data-[empty=true]:to-bexoni/5 data-[empty=true]:[background-size:8px_8px] data-[empty=true]:[background-image:repeating-linear-gradient(-45deg,transparent,transparent_3px,rgba(0,0,0,0.05)_3px,rgba(0,0,0,0.05)_4px)] focus-within:bg-background focus-within:[background-image:none]",
        checkerboard: "data-[empty=true]:bg-gradient-to-br data-[empty=true]:from-bexoni/5 data-[empty=true]:via-bexoni/10 data-[empty=true]:to-bexoni/5 data-[empty=true]:[background-size:8px_8px] data-[empty=true]:[background-image:repeating-conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_90deg,rgba(0,0,0,0.05)_90deg,rgba(0,0,0,0.05)_180deg,transparent_180deg,transparent_270deg,rgba(0,0,0,0.05)_270deg)] focus-within:bg-background focus-within:[background-image:none]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => {
    const [isEmpty, setIsEmpty] = React.useState(true);
    const [isFocused, setIsFocused] = React.useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setIsEmpty(e.target.value === '');
      props.onChange?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    return (
      <textarea
        className={cn(textareaVariants({ variant, className }))}
        ref={ref}
        data-empty={isEmpty && !isFocused}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    )
  },
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
