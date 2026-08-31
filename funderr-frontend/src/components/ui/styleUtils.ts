export const retainLayoutClasses = (className = "") =>
  className
    .split(/\s+/)
    .filter((token) =>
      /^(w-|min-w-|max-w-|m[trblxy]?-|col-|flex-|gap-|font-mono|text-(left|center|right)|self-|sm:|md:|lg:)/.test(token),
    )
    .join(" ");
