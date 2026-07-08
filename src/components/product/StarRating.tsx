import { Star } from "lucide-react";

interface Props {
  rating: number;
  reviewCount: number;
  size?: number;
  showCount?: boolean;
}

export default function StarRating({ 
  rating, 
  reviewCount, 
  size = 11, 
  showCount = true 
}: Props) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < Math.round(rating) ? "#f59e0b" : "none"}
          stroke={i < Math.round(rating) ? "#f59e0b" : "#d1d5db"}
        />
      ))}
      {showCount && (
        <span className="text-xs" style={{ color: "var(--color-muted)" }}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}