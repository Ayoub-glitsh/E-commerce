import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        set((state) => {
          if (state.items.find((item) => item.id === product.id)) {
            return state
          }
          return { items: [...state.items, product] }
        })
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }))
      },

      isInWishlist: (productId) => {
        return get().items.some((item) => item.id === productId)
      },

      toggleItem: (product) => {
        const state = get()
        if (state.items.find((item) => item.id === product.id)) {
          state.removeItem(product.id)
        } else {
          state.addItem(product)
        }
      },
    }),
    { name: '3lm-wishlist' }
  )
)
