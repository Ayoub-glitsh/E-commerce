import Navbar from './Navbar';
import Hero from './Hero';
import Footer from './Footer';
import Products from './Products';
import { Routes, Route } from "react-router-dom";
import ProductDetail from './ProductDetail';
import Cart from './Cart';
import WishList from './Wishlist';
import { Toaster } from 'react-hot-toast';
import Checkout from './Checkout';
import Chatbot from './Chatbot';
import Orders from './Orders';
import OrderDetail from './OrderDetail';
import AdminDashboard from './AdminDashboard';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Toaster />
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product-detail/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><WishList /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/order-detail/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        </Routes>
        <Chatbot />
      </main>

      <Footer />
    </div>
  );
}

export default App;