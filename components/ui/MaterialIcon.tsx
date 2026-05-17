type MaterialIconProps = {
  name: string;
  className?: string;
  label?: string;
};

export function MaterialIcon({ name, className = "", label }: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-rounded inline-flex select-none items-center justify-center ${className}`}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    >
      {name}
    </span>
  );
}
