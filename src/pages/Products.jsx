import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X, ChevronDown, Sparkles } from 'lucide-react'
import ProductCard from '../components/product/ProductCard'

function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [nlpSearch, setNlpSearch] = useState('')

  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const minRating = searchParams.get('minRating') || ''
  const page = Number(searchParams.get('page')) || 1

  const { data, isLoading } = useQuery({
    queryKey: ['products', { search: searchParams.get('search'), category, sort, minPrice, maxPrice, minRating, page }],
    queryFn: () => {
      const params = new URLSearchParams()
      if (searchParams.get('search')) params.set('search', searchParams.get('search'))
      if (category) params.set('category', category)
      if (sort) params.set('sort', sort)
      if (minPrice) params.set('minPrice', minPrice)
      if (maxPrice) params.set('maxPrice', maxPrice)
      if (minRating) params.set('minRating', minRating)
      params.set('page', page)
      params.set('limit', 12)
      return fetch(`/api/products?${params}`).then((r) => r.json())
    },
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then((r) => r.json()),
  })

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    setSearchParams(params)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    updateFilter('search', search)
  }

  const handleNlpSearch = async (e) => {
    e.preventDefault()
    if (!nlpSearch.trim()) return
    updateFilter('search', nlpSearch)
    setSearch(nlpSearch)
    setNlpSearch('')
  }

  const clearFilters = () => {
    setSearchParams({})
    setSearch('')
  }

  const hasActiveFilters = category || minPrice || maxPrice || minRating || searchParams.get('search')

  const sortOptions = [
    { value: '', label: 'Pertinence' },
    { value: 'price_asc', label: 'Prix croissant' },
    { value: 'price_desc', label: 'Prix décroissant' },
    { value: 'rating', label: 'Meilleures notes' },
    { value: 'newest', label: 'Nouveautés' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Nos Produits</h1>
        <p className="text-[var(--color-text-muted)]">
          {data?.total || 0} produits trouvés
        </p>
      </div>

      {/* Search Bars */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </form>
        <form onSubmit={handleNlpSearch} className="flex-1 relative">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
          <input
            type="text"
            placeholder="Recherche intelligente NLP..."
            value={nlpSearch}
            onChange={(e) => setNlpSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--color-surface)] border border-purple-500/30 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </form>
      </div>

      {/* Sort & Filter Toggle */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-white transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
          )}
        </button>

        <div className="relative">
          <select
            value={sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="appearance-none px-4 py-2 pr-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        {showFilters && (
          <aside className="w-64 shrink-0 animate-slide-up">
            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Filtres</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-[var(--color-primary-light)] hover:text-white transition-colors"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                  Catégorie
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => updateFilter('category', '')}
                    className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      !category
                        ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary-light)]'
                        : 'text-[var(--color-text-muted)] hover:text-white'
                    }`}
                  >
                    Toutes
                  </button>
                  {categories?.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => updateFilter('category', cat.name)}
                      className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        category === cat.name
                          ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary-light)]'
                          : 'text-[var(--color-text-muted)] hover:text-white'
                      }`}
                    >
                      {cat.name} ({cat.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                  Fourchette de prix (MAD)
                </h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-white text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-white text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                  Note minimum
                </h4>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      onClick={() => updateFilter('minRating', minRating === String(r) ? '' : String(r))}
                      className={`flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        minRating === String(r)
                          ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary-light)]'
                          : 'text-[var(--color-text-muted)] hover:text-white'
                      }`}
                    >
                      {r}+ étoiles
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Products Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-[var(--color-card)] rounded-xl overflow-hidden">
                  <div className="skeleton aspect-square" />
                  <div className="p-4 space-y-3">
                    <div className="skeleton h-4 w-20" />
                    <div className="skeleton h-5 w-3/4" />
                    <div className="skeleton h-4 w-24" />
                    <div className="skeleton h-6 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.products?.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: data.totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => updateFilter('page', String(i + 1))}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        page === i + 1
                          ? 'gradient-primary text-white'
                          : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-[var(--color-text-muted)] text-lg">
                Aucun produit trouvé
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 rounded-lg gradient-primary text-white text-sm"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Products
