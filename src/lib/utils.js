import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
  }).format(price)
}

export function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
