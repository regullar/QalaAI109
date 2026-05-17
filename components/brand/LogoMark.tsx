import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
  title?: string;
};

export function LogoMark({ className, title = "Qala AI logo" }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={title}
      role="img"
      className={cn("block h-full w-full", className)}
    >
      <path
        d="M50 0C77.6142 0 100 22.3858 100 50C100 77.6142 77.6142 100 50 100C22.3858 100 0 77.6142 0 50C0 22.3858 22.3858 0 50 0ZM53.7754 20.252L27.6807 57.917H42.3271L39.1602 79.9004H43.0576L71.9521 45.25H54.5361L57.6729 20.252H53.7754Z"
        fill="currentColor"
      />
    </svg>
  );
}
