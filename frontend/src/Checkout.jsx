import {
  MapPin,
  CreditCard,
  Lock,
  ShieldCheck,
  Truck,
  Headphones,
} from "lucide-react";
import {useForm} from "react-hook-form";
import {z} from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useCartStore from "./store/cartStore";

function Checkout(){
  const schema=z.object({
      FullName:z.string().min(1,"Name cannot be empty"),
      email:z.string().email("Invalid Email"),
      phone:z.string().regex(/^\d{10}$/,"Phone number must contain exactly 10 digits"),
      address:z.string().min(1,"Address cannot be empty"),
      city:z.string().min(1,"City cannot be empty"),
      postalCode:z.string().min(1,"Postal code cannot be empty"),
      cardNumber:z.string().min(16,"Please enter a valid card number"),
      ccv:z.string().min(3,"Enter a valid ccv").max(3,"Enter a valid ccv")
  })


  const {
     register,
     handleSubmit,
     formState:{errors},

}=useForm({
     resolver:zodResolver(schema)
});


const onSubmit=(data)=>{
     console.log(data);
}

const cart=useCartStore(state=>state.cart);

const subtotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
);
  const tax=subtotal*0.2;
    const total=subtotal+tax;


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
                {errors.FullName && ( <p>{errors.FullName.message}</p> )}
              </div>

              <div>
                <label className="font-medium block mb-2">
                  Email
                </label>

                <input
                  className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="yourname@gmail.com" {...register("email")}
                />
                {errors.email && ( <p>{errors.email.message}</p> )}
              </div>

              <div>
                <label className="font-medium block mb-2">
                  Phone
                </label>

                <input
                  className="w-full border rounded-xl p-3"
                  placeholder="+212..." {...register("phone")}
                />

                {errors.phone && ( <p>{errors.phone.message}</p> )}
              </div>

              <div>
                <label className="font-medium block mb-2">
                  Country
                </label>

                <select className="w-full border rounded-xl p-3">

                  <option>Morocco</option>

                </select>

              </div>

            </div>

            <div className="mt-5">

              <label className="font-medium block mb-2">

                Address

              </label>

              <input
                className="w-full border rounded-xl p-3"
                placeholder="Street..." {...register("address")}
              />
              {errors.address && ( <p>{errors.address.message}</p> )}

            </div>

            <div className="mt-5">

              <label className="font-medium block mb-2">

                Apartment (optional)

              </label>

              <input
                className="w-full border rounded-xl p-3"
              />

            </div>

            <div className="grid grid-cols-2 gap-5 mt-5">

              <div>

                <label className="font-medium block mb-2">

                  City

                </label>

                <input className="w-full border rounded-xl p-3" {...register("city")} />
                {errors.city && ( <p>{errors.city.message}</p> )}
              </div>

              <div>

                <label className="font-medium block mb-2">

                  Postal Code

                </label>

                <input className="w-full border rounded-xl p-3" {...register("postalCode")} />
                  {errors.postalCode && ( <p>{errors.postalCode.message}</p> )}
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
                  className="w-full border rounded-xl p-3"
                  {...register("cardNumber")}
                />
                {errors.cardNumber && ( <p>{errors.cardNumber.message}</p> )}
              </div>

              <div className="grid grid-cols-2 gap-5">

                <div>

                  <label className="font-medium block mb-2">

                    Expiration

                  </label>

                  <input
                    placeholder="MM/YY"
                    className="w-full border rounded-xl p-3"
                  />

                </div>

                <div>

                  <label className="font-medium block mb-2">

                    CVV

                  </label>

                  <input
                    placeholder="123"
                    className="w-full border rounded-xl p-3"
                    {...register("ccv")}
                  />
                  {errors.ccv && ( <p>{errors.ccv.message}</p> )}
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
              src={item.image}
              className="rounded-xl w-20"
            />

            <div>

              <h3 className="font-semibold">

                {item.name}

              </h3>

              <p className="text-gray-500">

                Qty : {item.quantity}

              </p>

            </div>

            <p className="ml-auto font-bold">

              {item.price}€

            </p>

          </div>
          ))}

          <hr className="my-5" />

          <div className="space-y-3">

            <div className="flex justify-between">

              <span className="text-gray-500">

                Subtotal

              </span>

              <span>

                {subtotal.toFixed(2)}€

              </span>

            </div>

            <div className="flex justify-between">

              <span className="text-gray-500">

                Shipping

              </span>

              <span>

                Free

              </span>

            </div>

            <div className="flex justify-between">

              <span className="text-gray-500">

                Tax

              </span>

              <span>

                {tax.toFixed(2)}€

              </span>

            </div>

          </div>

          <hr className="my-5" />

          <div className="flex justify-between items-center mb-8">

            <h2 className="text-2xl font-bold">

              Total

            </h2>

            <h2 className="text-3xl font-bold text-indigo-600">

              {total}€

            </h2>

          </div>

          <button className="w-full bg-indigo-600 hover:bg-indigo-700 transition text-white rounded-xl py-4 font-semibold flex justify-center items-center gap-2" type="submit">

            <Lock size={18} />

            Pay Now

          </button>

          <div className="mt-8 space-y-4">

            <div className="flex gap-3 items-center">

              <ShieldCheck size={18} />

              <p className="text-sm text-gray-500">

                Secure payment

              </p>

            </div>

            <div className="flex gap-3 items-center">

              <Truck size={18} />

              <p className="text-sm text-gray-500">

                Fast delivery

              </p>

            </div>

            <div className="flex gap-3 items-center">

              <Headphones size={18} />

              <p className="text-sm text-gray-500">

                24/7 Support

              </p>

            </div>

          </div>

        </div>

      </div>

      </div>
    </form> 
   )
}
export default Checkout;