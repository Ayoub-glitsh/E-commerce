import { create } from "zustand";
import toast from "react-hot-toast";

const useCartStore = create((set) => ({
    

    wish:(()=>{
         const saved=localStorage.getItem("wish");
         return saved?JSON.parse(saved): [];
    })(),

    cart: (() => {
        const saved = localStorage.getItem("cart");
        return saved ? JSON.parse(saved) : [];
     })(),
    
   clearWish:()=>set({wish:[]}),
   
   handleWish:(product)=>set(state=>{
        const wished=state.wish.some(item=>item.id===product?.id);
        if(wished){
             return{
                 wish:state.wish.filter(item=>item.id!==product.id)
             }
             toast.error('Product removed from wish list ❌',{
             style:{
                    background: '#ef4444', 
                    color: '#fff',
                    fontWeight: '500',
             },
             iconTheme: {
            primary: '#fff',
            secondary: '#22c55e',
             },
          })
        }
        else{
             return{
                 wish:[
                     ...state.wish,
                     {
                         ...product
                     }
                 ]
             }
             toast.success('Product added to wish list ❤️',{
             style:{
                    background: '#22c55e', 
                    color: '#fff',
                    fontWeight: '500',
             },
             iconTheme: {
            primary: '#fff',
            secondary: '#22c55e',
             },
         })
        }
   }),
  deleteFromWishList:(id)=>set(state=>{
      return{
         wish:state.wish.filter(item=>item.id!==id)
      }
       toast.error(`Product removed from Wish list`,{
            style: {
                    background: '#ef4444', 
                    color: '#fff',
                    fontWeight: '500',
            },
            iconTheme: {
            primary: '#fff',
            secondary: '#22c55e',
            },
        });
  }),
      moveToCart:(id)=>set(state=>{
      const product=state.wish.find(item=>item.id===id);
      const exists=state.cart.find(item=>item.id===id);
      const qty = 1;

      if(!exists){
        
          return{
             cart:[
                 ...state.cart,
                 {
                     ...product,
                     quantity:qty
                 }
             ]
          }
           toast.success(`${product.name} added to cart`,{
        style: {
        background: '#22c55e', 
        color: '#fff',
        fontWeight: '500',
        },
        iconTheme: {
        primary: '#fff',
        secondary: '#22c55e',
        },
   });

      }
      else{
         return {
             cart:state.cart.map(item=>item.id===product.id?
                { 
                    ...item,
                    quantity:item.quantity+qty
                }:item
             )
         }
          toast.success(`${product.name} added to cart`,{
        style: {
        background: '#22c55e', 
        color: '#fff',
        fontWeight: '500',
        },
        iconTheme: {
        primary: '#fff',
        secondary: '#22c55e',
        },
   });
      }
      
  }),
     

    clearCart: () => set({ cart: [] }),

    addProductToCart: (product, qty = 1) =>
        set((state) => {
            const exists = state.cart.find(
                (item) => item.id === product.id
            );

            const quantity = qty > 0 ? qty : 1;

            if (!exists) {
                toast.success(`${product.name} added to cart`, {
                    style: {
                        background: "#22c55e",
                        color: "#fff",
                        fontWeight: "500",
                    },
                    iconTheme: {
                        primary: "#fff",
                        secondary: "#22c55e",
                    },
                });

                return {
                    cart: [
                        ...state.cart,
                        {
                            ...product,
                            quantity,
                        },
                    ],
                };
            }

            toast.success(`${product.name} quantity updated`, {
                style: {
                    background: "#22c55e",
                    color: "#fff",
                    fontWeight: "500",
                },
                iconTheme: {
                    primary: "#fff",
                    secondary: "#22c55e",
                },
            });

            return {
                cart: state.cart.map((item) =>
                    item.id === product.id
                        ? {
                              ...item,
                              quantity: item.quantity + quantity,
                          }
                        : item
                ),
            };
        }),

    deleteProductFromCart: (id) =>
        set((state) => ({
            cart: state.cart.filter((item) => item.id !== id),
        })),

    increaseQuantity: (id) =>
        set((state) => ({
            cart: state.cart.map((item) =>
                item.id === id
                    ? {
                          ...item,
                          quantity: item.quantity + 1,
                      }
                    : item
            ),
        })),

    

     decreaseQuantity:(id)=>set(state=>({
          cart:state.cart.map(item=>item.id===id ?{
             ...item,
             quantity:Math.max(1, item.quantity - 1),
          }:item)
     }))   
}));

export default useCartStore;