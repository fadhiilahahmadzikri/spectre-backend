interface ScrimVignetteProps {
  show: boolean;
}

export function ScrimVignette({ show }: ScrimVignetteProps) {
  return <div className={`scrim-vignette ${show ? "show" : ""}`} aria-hidden="true" />;
}
