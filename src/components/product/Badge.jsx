function Badge({ variant = 'default', children }) {
  const variants = {
    default: 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]',
    new: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    sale: 'bg-red-500/20 text-red-400 border border-red-500/30',
    outOfStock: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    delivered: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    inProgress: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    preparing: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border border-red-500/30',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant] || variants.default}`}
    >
      {children}
    </span>
  )
}

export function getOrderStatusBadge(status) {
  switch (status) {
    case 'Livré':
      return <Badge variant="delivered">{status}</Badge>
    case 'En cours':
      return <Badge variant="inProgress">{status}</Badge>
    case 'En préparation':
      return <Badge variant="preparing">{status}</Badge>
    case 'Annulé':
      return <Badge variant="cancelled">{status}</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export default Badge
