import { MapPin, CreditCard, Lock, ShieldCheck, Truck, Headphones } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useCartStore from "./store/cartStore";
import { useNavigate } from "react-router-dom"; // Pour la redirection
import toast from "react-hot-toast"; // Pour les notifications

function Checkout() {
  const navigate = useNavigate(); // Permet de rediriger l'utilisateur après le paiement
  const cart = useCartStore(state => state.cart);
  const clearCart = useCartStore(state => state.clearCart); 
  const addOrder = useCartStore(state => state.addOrder); 

  const schema = z.object({
      FullName: z.string().min(1, "Name cannot be empty"),
      email: z.string().email("Invalid Email"),
      phone: z.string().regex(/^\d{10}$/, "Phone number must contain exactly 10 digits"),
      address: z.string().min(1, "Address cannot be empty"),
      city: z.string().min(1, "City cannot be empty"),
      postalCode: z.string().min(1, "Postal code cannot be empty"),
      cardNumber: z.string().min(16, "Please enter a valid card number"),
      ccv: z.string().min(3, "Enter a valid ccv").max(3, "Enter a valid ccv")
  });

  const {
     register,
     handleSubmit,
     formState: { errors },
  } = useForm({
     resolver: zodResolver(schema)
  });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.2;
  const total = subtotal + tax;

  const onSubmit = (data) => {
      if (cart.length === 0) {
          toast.error("Your cart is empty!");
          return;
      }

      // Création de la commande complète avec le nom du client
      const newOrder = {
          id: `CMD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
          date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: "En préparation", 
          total: total,
          customer: data.FullName, // Ajout du nom du client pour le Dashboard Admin
          address: `${data.address}, ${data.postalCode} ${data.city}`, 
          items: [...cart]
      };

      addOrder(newOrder); 
      clearCart();        
      
      toast.success("Order placed successfully!", {
          style: { background: '#22c55e', color: '#fff', fontWeight: '500' },
          iconTheme: { primary: '#fff', secondary: '#22c55e' },
      });
      
      navigate('/orders'); // Redirige vers la page /orders (ou /historique selon votre route)
  }

  return (
   <form onSubmit={handleSubmit(onSubmit)}>
      <div className="max-w-7xl mx-auto px-6 py-10">
          {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-bold">
          Checkout
        </h1>
        <div className="text-sm text-gray-500">
          Secure Checkout
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-8">
          {/* Shipping */}
          <div className="bg-white border rounded-2xl shadow-sm p-7">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="text-indigo-600" />
              <h2 className="text-2xl font-bold">
                Shipping Information
              </h2>
            </div>
      
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="font-medium block mb-2">
                  Full Name
                </label>
                <input
                  className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="First name" {...register("FullName")}
                />
                {errors.FullName && ( <p className="text-red-500 text-xs mt-1">{errors.FullName.message}</p> )}
              </div>

              <div>
                <label className="font-medium block mb-2">
                  Email
                </label>
                <input
                  className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="yourname@gmail.com" {...register("email")}
                />
                {errors.email && ( <p className="text-red-500 text-xs mt-1">{errors.email.message}</p> )}
              </div>

              <div>
                <label className="font-medium block mb-2">
                  Phone
                </label>
                <input
                  className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0612345678" {...register("phone")}
                />
                {errors.phone && ( <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p> )}
              </div>

              <div>
                <label className="font-medium block mb-2">
                  Country
                </label>
                <select className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>Morocco</option>
                  <option>France</option>
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label className="font-medium block mb-2">
                Address
              </label>
              <input
                className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Street..." {...register("address")}
              />
              {errors.address && ( <p className="text-red-500 text-xs mt-1">{errors.address.message}</p> )}
            </div>

            <div className="mt-5">
              <label className="font-medium block mb-2">
                Apartment (optional)
              </label>
              <input
                className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-5 mt-5">
              <div>
                <label className="font-medium block mb-2">
                  City
                </label>
                <input className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500" {...register("city")} />
                {errors.city && ( <p className="text-red-500 text-xs mt-1">{errors.city.message}</p> )}
              </div>

              <div>
                <label className="font-medium block mb-2">
                  Postal Code
                </label>
                <input className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500" {...register("postalCode")} />
                  {errors.postalCode && ( <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p> )}
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white border rounded-2xl shadow-sm p-7">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="text-indigo-600" />
              <h2 className="text-2xl font-bold">
                Payment
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="font-medium block mb-2">
                  Card Number
                </label>
                <input
                  placeholder="1234 5678 9012 3456"
                  className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register("cardNumber")}
                />
                {errors.cardNumber && ( <p className="text-red-500 text-xs mt-1">{errors.cardNumber.message}</p> )}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="font-medium block mb-2">
                    Expiration
                  </label>
                  <input
                    placeholder="MM/YY"
                    className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-medium block mb-2">
                    CVV
                  </label>
                  <input
                    placeholder="123"
                    className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                    {...register("ccv")}
                  />
                  {errors.ccv && ( <p className="text-red-500 text-xs mt-1">{errors.ccv.message}</p> )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-white border rounded-2xl shadow-sm p-6 h-fit sticky top-6">
          <h2 className="text-2xl font-bold mb-6">
            Order Summary
          </h2>

          {cart.map(item=>(
          <div className="flex gap-4 mb-5" key={item.id}>
            <img
              src={Array.isArray(item.image) ? item.image[0] : item.image}
              alt={item.name}
              className="rounded-xl w-20 bg-gray-50 object-contain"
            />
            <div>
              <h3 className="font-semibold text-sm">
                {item.name}
              </h3>
              <p className="text-gray-500 text-sm">
                Qty : {item.quantity}
              </p>
            </div>
            <p className="ml-auto font-bold text-sm">
              {(item.price * item.quantity).toFixed(2)}€
            </p>
          </div>
          ))}

          <hr className="my-5" />

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{subtotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Shipping</span>
              <span className="font-medium text-emerald-600">Free</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tax</span>
              <span className="font-medium">{tax.toFixed(2)}€</span>
            </div>
          </div>

          <hr className="my-5" />

          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Total</h2>
            <h2 className="text-3xl font-bold text-indigo-600">
              {total.toFixed(2)}€
            </h2>
          </div>

          <button className="w-full bg-indigo-600 hover:bg-indigo-700 transition text-white rounded-xl py-4 font-semibold flex justify-center items-center gap-2" type="submit">
            <Lock size={18} />
            Pay Now
          </button>

          <div className="mt-8 space-y-4">
            <div className="flex gap-3 items-center">
              <ShieldCheck size={18} className="text-gray-400" />
              <p className="text-sm text-gray-500">Secure payment</p>
            </div>
            <div className="flex gap-3 items-center">
              <Truck size={18} className="text-gray-400" />
              <p className="text-sm text-gray-500">Fast delivery</p>
            </div>
            <div className="flex gap-3 items-center">
              <Headphones size={18} className="text-gray-400" />
              <p className="text-sm text-gray-500">24/7 Support</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </form> 
   )
}
export default Checkout;