// Deliberate photo plates — empty slots read as designed placeholders, not gaps.
export default function PhotoSlot({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div className={`plate absolute inset-0 flex items-center justify-center p-3 ${className}`}>
      <span className="line-clamp-2">{label}</span>
    </div>
  );
}
