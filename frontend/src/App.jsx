import Navbar from './Navbar';
import Hero from './Hero';
import Footer from './Footer';
import Products from './Products';
import { Routes, Route } from "react-router-dom";
import ProductDetail from './ProductDetail';
import { useEffect, useState } from 'react';
import Cart from './Cart';
import { createContext } from 'react';
import WishList from './Wishlist';
import { Toaster } from 'react-hot-toast';
import Checkout from './Checkout';
import useCartStore from './store/cartStore';

function App() {
  const cart = useCartStore(state => state.cart);
  const wish = useCartStore(state => state.wish);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("wish", JSON.stringify(wish));
  }, [wish]);

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster />
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product-detail/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<WishList />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;