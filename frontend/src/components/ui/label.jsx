import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef(({ className, children, ...props }, ref) => (
  <label ref={ref} className={cn("block text-sm font-medium mb-1", className)} {...props}>
    {children}
  </label>
));
Label.displayName = "Label";

export { Label };
export default Label;
