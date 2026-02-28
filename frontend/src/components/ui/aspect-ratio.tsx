"use client";

import * as React from "react";

const AspectRatio = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { ratio?: number }
>(({ ratio = 1, style, ...props }, ref) => (
  <div
    ref={ref}
    style={{ position: "relative", width: "100%", aspectRatio: String(ratio), ...style }}
    {...props}
  />
));
AspectRatio.displayName = "AspectRatio";

export { AspectRatio };
