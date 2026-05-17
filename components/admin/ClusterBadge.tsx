type ClusterBadgeProps = {
  count: number;
};

export function ClusterBadge({ count }: ClusterBadgeProps) {
  const isHot = count >= 3;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        isHot ? "bg-app-dark text-white" : "bg-app-surfaceStrong text-app-textMuted"
      }`}
    >
      {isHot ? `Кластер x${count}` : `x${count}`}
    </span>
  );
}
