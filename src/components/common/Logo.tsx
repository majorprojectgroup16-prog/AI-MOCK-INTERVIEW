import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      {...props}
    >
      <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" fill="hsl(var(--primary))"/>
      <path d="M20 12h-4" stroke="hsl(var(--accent))" />
      <path d="M4 12h4" stroke="hsl(var(--accent))" />
      <path d="M12 4v4" stroke="hsl(var(--accent))" />
      <path d="M12 16v4" stroke="hsl(var(--accent))" />
      <path d="M17.65 6.35l-2.83 2.83" stroke="hsl(var(--accent))" />
      <path d="M6.35 17.65l2.83-2.83" stroke="hsl(var(--accent))" />
      <path d="M17.65 17.65l-2.83-2.83" stroke="hsl(var(--accent))" />
      <path d="M6.35 6.35l2.83 2.83" stroke="hsl(var(--accent))" />
    </svg>
  );
}
