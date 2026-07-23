import { Link } from "react-router-dom";

import { useContext, useEffect,useState } from "react";
import { Heart } from "lucide-react";
import useCartStore from "./store/cartStore";




function Navbar(){
  
    
     const cart=useCartStore(state=>state.cart);
     const wishList=useCartStore(state=>state.wish);

     const [quantity,setQuantity]=useState(0);
     const [wishQuantity,setWishQuantity]=useState(0);
     
      const totalQuantity=cart.reduce((sum,item)=>
           sum+item.quantity,
           0
      );

      const totalQuantityWish=wishList.length;


    return (
        
           <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
             <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                 <Link to="/"><h1 className="text-2xl font-extrabold tracking-tight">3lm<span className="text-indigo-600">solutions</span></h1></Link>
              

              <div className="hidden md:flex items-center gap-8">
                  <Link to="/" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Home</Link>
                  <Link to="/products" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Products</Link>
                  <Link to="/categories" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Categories</Link>
                  <Link to="/deals" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Deals</Link>
              </div>

              <div className="flex items-center gap-3">
                  <button className="text-sm text-gray-600 hover:text-indigo-600 transition-colors px-3 py-2">Sign in</button>
                 <Link to="/cart">
                       <button className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors shadow-sm">Cart:{totalQuantity}</button>

                  </Link> 

                  <Link to="/wishlist">
                       <div className="flex items-center justify-between">
                           <button><Heart></Heart></button>
                           :{totalQuantityWish}
                       </div>
                        
                  </Link>
              </div>
            </div>
           </nav>
      
       );
}
export default Navbar;