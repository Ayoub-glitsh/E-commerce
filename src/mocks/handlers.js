import { http, HttpResponse } from 'msw'
import { products, categories, reviews, orders } from './data'

export const handlers = [
  // === PRODUCTS ===
  http.get('/api/products', ({ request }) => {
    const url = new URL(request.url)
    let filtered = [...products]

    // Search
    const search = url.searchParams.get('search')
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    // Category filter
    const category = url.searchParams.get('category')
    if (category) {
      filtered = filtered.filter((p) => p.category === category)
    }

    // Price range
    const minPrice = url.searchParams.get('minPrice')
    const maxPrice = url.searchParams.get('maxPrice')
    if (minPrice) filtered = filtered.filter((p) => p.price >= Number(minPrice))
    if (maxPrice) filtered = filtered.filter((p) => p.price <= Number(maxPrice))

    // Rating filter
    const minRating = url.searchParams.get('minRating')
    if (minRating) filtered = filtered.filter((p) => p.rating >= Number(minRating))

    // Sort
    const sort = url.searchParams.get('sort')
    switch (sort) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
        break
      default:
        break
    }

    // Pagination
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Number(url.searchParams.get('limit')) || 12
    const start = (page - 1) * limit
    const paged = filtered.slice(start, start + limit)

    return HttpResponse.json({
      products: paged,
      total: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / limit),
    })
  }),

  http.get('/api/products/:id', ({ params }) => {
    const product = products.find((p) => p.id === Number(params.id))
    if (!product) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(product)
  }),

  // === CATEGORIES ===
  http.get('/api/categories', () => {
    return HttpResponse.json(categories)
  }),

  // === RECOMMENDATIONS ===
  http.get('/api/recommendations/trending', () => {
    const trending = products.sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8)
    return HttpResponse.json(trending)
  }),

  http.get('/api/recommendations/similar/:id', ({ params }) => {
    const product = products.find((p) => p.id === Number(params.id))
    if (!product) return HttpResponse.json([])
    const similar = products
      .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
      .slice(0, 4)
    return HttpResponse.json(similar)
  }),

  // === REVIEWS ===
  http.get('/api/reviews/:productId', ({ params }) => {
    const productReviews = reviews.filter(
      (r) => r.productId === Number(params.productId)
    )
    const avgRating =
      productReviews.length > 0
        ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
        : 0

    return HttpResponse.json({
      reviews: productReviews,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: productReviews.length,
      aiSummary: {
        pros: ['Qualité premium', 'Bon rapport qualité/prix', 'Design élégant'],
        cons: ['Prix un peu élevé pour certains budgets'],
      },
    })
  }),

  // === AUTH ===
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      user: {
        id: 1,
        name: body.name,
        email: body.email,
      },
      token: 'mock-jwt-token-' + Date.now(),
    })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json()
    if (body.email === 'test@test.com' && body.password === 'password') {
      return HttpResponse.json({
        user: {
          id: 1,
          name: 'Ahmed Khalil',
          email: body.email,
        },
        token: 'mock-jwt-token-' + Date.now(),
      })
    }
    // Accept any credentials for demo
    return HttpResponse.json({
      user: {
        id: 1,
        name: body.email.split('@')[0],
        email: body.email,
      },
      token: 'mock-jwt-token-' + Date.now(),
    })
  }),

  // === ORDERS ===
  http.get('/api/orders', () => {
    return HttpResponse.json(orders)
  }),

  http.get('/api/orders/:id', ({ params }) => {
    const order = orders.find((o) => o.id === params.id)
    if (!order) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(order)
  }),

  http.post('/api/orders', async ({ request }) => {
    const body = await request.json()
    const newOrder = {
      id: `CMD-2025-${String(orders.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      status: 'En préparation',
      total: body.total,
      shippingCost: body.total > 500 ? 0 : 49,
      address: body.address,
      items: body.items,
    }
    orders.push(newOrder)
    return HttpResponse.json(newOrder, { status: 201 })
  }),

  // === NLP SEARCH ===
  http.post('/api/search/nlp', async ({ request }) => {
    const body = await request.json()
    const query = body.query.toLowerCase()
    const results = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.tags.some((t) => t.includes(query))
    )
    return HttpResponse.json({
      results,
      interpretation: `Recherche intelligente pour "${body.query}"`,
    })
  }),
]
