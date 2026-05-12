const ICON_PATHS = {
  add: "M12 5v14M5 12h14",
  alert: "M12 9v4m0 4h.01M10.29 3.86 1.82 14.32A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.71-3.03L13.71 3.86a2 2 0 0 0-3.42 0Z",
  barChart: "M4 19V9m8 10V5m8 14v-7",
  box: "M21 8 12 3 3 8l9 5 9-5ZM3 8v8l9 5 9-5V8M12 13v8",
  check: "m5 13 4 4L19 7",
  edit: "M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z",
  help: "M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4m.09 4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
  home: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3V10.5Z",
  lightning: "M13 2 4 14h7l-1 8 9-12h-7l1-8Z",
  logo: "M12 19V5m0 0-5 5m5-5 5 5",
  logout: "M10 17 15 12l-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6m0 18h6a2 2 0 0 0 2-2",
  menu: "M4 6h16M4 12h16M4 18h16",
  moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z",
  qr: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2h-2v-2Zm4 0h2v2h-2v-2Z",
  search: "m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z",
  sun: "M12 4V2m0 20v-2m8-8h2M2 12h2m14.36 6.36 1.41 1.41M4.22 4.22l1.42 1.42m12.72-1.42-1.41 1.42M4.22 19.78l1.42-1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
  trash: "M3 6h18M8 6V4h8v2m-10 0 1 15h10l1-15M10 11v6m4-6v6",
  user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
};

export default function Icon({ name, size = 18, strokeWidth = 2, className = "", title, ...props }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
