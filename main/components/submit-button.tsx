"use client";

import { Button } from "@/components/ui/button";
import { Bubbles } from "lucide-react";
import { type ComponentProps } from "react";
import { useFormStatus } from "react-dom";

type Props = ComponentProps<typeof Button> & {
  pendingText?: string;
};

export function SubmitButton({
  children,
  pendingText = "Submitting...",
  ...props
}: Props) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" aria-disabled={pending} {...props}>
      {pending ? (
        <>
          <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
