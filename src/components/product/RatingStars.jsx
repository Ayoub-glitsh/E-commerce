import { Star } from 'lucide-react'

function RatingStars({ rating, size = 'sm', showValue = true }) {
  const sizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizes[size]} ${
              star <= Math.round(rating)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-[var(--color-border)]'
            }`}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-[var(--color-text-muted)] ml-1">
          {rating}
        </span>
      )}
    </div>
  )
}

export default RatingStars
