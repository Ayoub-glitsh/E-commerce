import { useState,useEffect,useContext,useRef, use } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import {ShoppingCart, Heart, ChevronLeft, Star, CheckCircle2, AlertTriangle, Sparkles} from "lucide-react";
import toast from "react-hot-toast";
import useCartStore from "./store/cartStore";
import { useStore } from "zustand";


function ProductDetail(){


const addToCart=useCartStore(state=>state.addProductToCart);
const cart=useCartStore(state=>state.cart);
const wish=useCartStore(state=>state.wish);
const handleWish=useCartStore(state=>state.handleWish);
const clearWish=useCartStore(state=>state.clearWish);


const {id}=useParams();

   const [products,setProducts]=useState([]);
   const [quantity, setQuantity] = useState(1);
   const [images,setImage]=useState(0);
   const [reviews,setReviews]=useState([]);
   const [ratingFilter,setRatingFilter]=useState(0); 

   const positiveKeywords = ["bon","excellent","recommande","top","rapide","qualité","parfait","génial","satisfait","fiable"];
   const negativeKeywords = ["mauvais","déçu","lent","cher","problème","défaut","cassé","horrible","fragile"];

   function getAiSummary(list){
        if(!list || list.length===0) return {pros:[],cons:[]};
        const prosSet=new Set();
        const consSet=new Set();
        list.forEach(r=>{
            const text=(r.comment||"").toLowerCase();
            positiveKeywords.forEach(k=>{ if(text.includes(k)) prosSet.add(k) });
            negativeKeywords.forEach(k=>{ if(text.includes(k)) consSet.add(k) });
        });
        return { pros:[...prosSet].slice(0,4), cons:[...consSet].slice(0,4) };
   }

   const containerRef = useRef(null);
   const [isHovering, setIsHovering] = useState(false);
   const [bgPos, setBgPos] = useState({ x: 0, y: 0 });
   const zoom = 2.5;

   const handleMouseMove = (e) => {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setBgPos({ x, y });
   }




 
   const handleQuantityPlus=()=>{
       
        setQuantity(q=>q+1);
   }
    const handleQuantityMinus=()=>{
        if(quantity>0){
            setQuantity(q=>q-1);
        }
        
   }



   const handleImage=(index)=>{
      setImage(index);
   }
 
   useEffect(()=>{
        async function loadProducts(){
             const response= await fetch("/api/products");
             const data = await response.json();
             setProducts(data);
        }  
        loadProducts();
    },[])
  

const product=products.find(p=>p.id===Number(id));
const wished=wish.some(item=>item.id===product?.id);
const produitSimilaire = products.filter((p) => {
    return p.category === product.category && p.id !== product.id;
});
if(products.length === 0){
    return <p>Chargement...</p>;
}

if(!product){
    return <p>Produit introuvable.</p>;
}

const totalReviews = product.reviews.length;
const avgRating = totalReviews
    ? (product.reviews.reduce((sum,r)=>sum+(r.rating || product.rating),0) / totalReviews).toFixed(1)
    : 0;
const ratingCounts = [5,4,3,2,1].map(star=>({
    star,
    count: product.reviews.filter(r=>Math.round(r.rating || product.rating)===star).length
}));
const filteredReviews = ratingFilter===0
    ? product.reviews
    : product.reviews.filter(r=>Math.round(r.rating || product.rating)===ratingFilter);
const aiSummary = getAiSummary(product.reviews);

    return(
     <div className="max-w-7xl mx-auto px-2 py-8">
            <nav className="flex items-center gap-1.5 text-xs text-gray-500 ">
                 <Link to="/" className="hover:text-gray-900">Acceuil</Link>
                 <span>/</span>
                 <Link to="/products" className="hover:text-gray-900">Produits</Link>
                 <span>/</span>
                 <p>{product.name}</p>                 
            </nav>
        <div>
            <div className="mt-8">

    <div className="grid grid-cols-2 gap-16 lg:grid-cols-2">
        <div>
            <div
                ref={containerRef}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onMouseMove={handleMouseMove}
                className="relative bg-gray-50 border border-gray-200 rounded-3xl h-[500px] overflow-hidden cursor-crosshair"
            >
                <img
                    src={product.image[images]}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-xl transition-transform duration-150 ease-out"
                    style={{
                        transform: isHovering ? `scale(${zoom})` : "scale(1)",
                        transformOrigin: `${bgPos.x}% ${bgPos.y}%`,
                    }}
                />
            </div>

            <div className="flex gap-4 mt-5">
                {product.image.map((img, index) => (
                    <button
                        key={index}
                        onClick={() => handleImage(index)}
                        className={`w-16 h-16 rounded-xl border flex items-center justify-center
                            ${
                                images === index
                                ? "border-2 border-indigo-500"
                                : "border-gray-200 hover:border-indigo-400"
                            }`}
                    >

                        <img
                            src={img}
                            className="w-9 object-contain rounded-xl"
                        />

                    </button>

                ))}

            </div>

        </div>

        {/* RIGHT */}

        <div>

            <div className="flex items-center gap-3">
                <p className="uppercase tracking-widest text-xs text-gray-400 font-semibold">
                    {product.category}
                </p>
            </div>
            <h1 className="font-bold text-5xl mt-5">
                {product.name}
            </h1>
            <div className="flex items-center gap-2 mt-5">
                <span className="text-yellow-400 text-lg">
                    ⭐⭐⭐⭐⭐
                </span>
                <span className="text-gray-600">
                    {product.rating}
                </span>
                <span className="text-gray-400">
                    • 8901 avis
                </span>
            </div>
           <h2 className="font-bold text-5xl mt-8">
                {product.price} €
            </h2>
            <p className="text-gray-600 leading-8 mt-7">
               Caméra professionnelle 48 MP, puce A18 Pro,
                et un écran Super Retina XDR de 6,3 pouces.
            </p>
            <div className="flex items-center gap-2 mt-7">
                <CheckCircle2
                    size={18}
                    className="text-green-600"
                />

                <p className="text-green-600 font-medium">
                    En stock (12 disponibles)

                </p>

            </div>

            {/* Buttons */}

            <div className="flex gap-4 mt-8">

                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">

                    <button className="px-5 py-4 hover:bg-gray-100" onClick={handleQuantityMinus} >
                        -
                    </button>

                    <span className="px-5 font-medium" >
                        {quantity}
                    </span>
                    <button className="px-5 py-4 hover:bg-gray-100" onClick={handleQuantityPlus}>
                        +
                    </button>

                </div>

                <button className="flex-1 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 font-semibold hover:bg-indigo-600 transition" onClick={()=>addToCart(product,quantity)}>
                    <ShoppingCart size={18}/>
                    Ajouter au panier
                </button>
                <button className={`w-14 h-14 border rounded-xl flex items-center justify-center transition
                        ${
                          wished? "bg-red-500 text-white border-red-500":"border-gray-200 hover:bg-red-500 hover:text-white"
                     }`} onClick={()=>handleWish(product)}>
                    <Heart size={18} fill={wished ? "currentColor" : "none"}/>
                </button>

            </div>

        </div>

     </div>

   </div>
             
        </div>

        <div className="mt-9">
             <h2 className="text-2xl font-bold text-gray-900 mt-10">
                         Avis clients
            </h2>

            {/* Note globale + répartition par étoile, cliquable pour filtrer */}
            <div className="flex flex-col md:flex-row gap-8 mt-6 bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex flex-col items-center justify-center md:w-48 md:border-r md:border-gray-100">
                    <span className="text-5xl font-bold text-gray-900">{avgRating}</span>
                    <span className="text-yellow-400 text-lg mt-1">⭐⭐⭐⭐⭐</span>
                    <span className="text-gray-500 text-sm mt-1">{totalReviews} avis</span>
                </div>

                <div className="flex-1 flex flex-col gap-2 justify-center">
                    {ratingCounts.map(({star,count})=>(
                        <button
                            key={star}
                            onClick={()=>setRatingFilter(ratingFilter===star?0:star)}
                            className="flex items-center gap-3 text-sm w-full"
                        >
                            <span className={`w-10 text-left ${ratingFilter===star?"font-semibold text-indigo-600":"text-gray-600"}`}>
                                {star} ⭐
                            </span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${ratingFilter===star?"bg-indigo-500":"bg-yellow-400"}`}
                                    style={{width:`${totalReviews?(count/totalReviews)*100:0}%`}}
                                />
                            </div>
                            <span className="w-8 text-gray-400 text-right">{count}</span>
                        </button>
                    ))}
                    {ratingFilter!==0 && (
                        <button
                            onClick={()=>setRatingFilter(0)}
                            className="text-xs text-indigo-600 self-start mt-1 hover:underline"
                        >
                            Réinitialiser le filtre
                        </button>
                    )}
                </div>
            </div>

            {/* pros/cons*/}
            {(aiSummary.pros.length>0 || aiSummary.cons.length>0) && (
                <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={18} className="text-indigo-600" />
                        <h3 className="font-semibold text-indigo-900">Résumé généré par IA</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-medium text-green-700 mb-2">Points forts</p>
                            <ul className="space-y-1.5 text-sm text-gray-700">
                                {aiSummary.pros.length>0 ? aiSummary.pros.map((p,i)=>(
                                    <li key={i} className="flex items-start gap-2 capitalize">
                                        <CheckCircle2 size={14} className="text-green-600 mt-0.5 shrink-0"/>
                                        {p}
                                    </li>
                                )) : <li className="text-gray-400">Pas assez d'avis pour dégager une tendance.</li>}
                            </ul>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-red-700 mb-2">Points faibles</p>
                            <ul className="space-y-1.5 text-sm text-gray-700">
                                {aiSummary.cons.length>0 ? aiSummary.cons.map((c,i)=>(
                                    <li key={i} className="flex items-start gap-2 capitalize">
                                        <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0"/>
                                        {c}
                                    </li>
                                )) : <li className="text-gray-400">Aucun point négatif majeur relevé.</li>}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* filtre note */}
            {filteredReviews.length===0 && (
                <p className="text-gray-400 text-sm mt-6">Aucun avis pour cette note.</p>
            )}
                 {filteredReviews.map((review)=>(
                    <div key={review.id} className="bg-gray-100 border border-gray-100 rounded-xl p-4 mt-3">
                        <div className="flex items-center justify-between mt-4">
                               <h3 className="font-semibold text-gray-900">
                                        {review.author}
                               </h3>
                               <p className="text-gray-600 text-sm">{review.date}</p>
                        </div>
                        <div>
                           <span className="text-yellow-400 text-sm">
                                    {"⭐".repeat(Math.round(review.rating || product.rating))}
                            </span>
                            <span className="text-gray-600 text-sm ml-1">
                                {review.rating || product.rating}
                            </span>

                            <p className="mt-2">{review.comment}</p>
                        </div>            
                    </div>        
                 ))}  
              <div>
                 
             </div>
        </div>
        
        <div className="mt-10">
             <h2 className="text-2xl font-bold text-gray-900">Produits similaires</h2>
        </div>

      <div className="grid grid-cols-4 gap-6 mt-6">
            {produitSimilaire.map((p) => (
                <Link
                    key={p.id}
                    to={`/product-detail/${p.id}`}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition"
                >
                    <img
                        src={p.image[0]}
                        alt={p.name}
                        className="w-full h-52 object-cover"
                    />

                    <div className="p-4">
                        <h3 className="font-semibold">
                            {p.name}
                        </h3>

                        <p className="text-gray-500 text-sm">
                            {p.category}
                        </p>

                        <div className="flex justify-between mt-3">
                            <span className="font-bold">
                                {p.price} €
                            </span>

                            <span>
                                ⭐ {p.rating}
                            </span>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    </div>                  
           
      

         
     );
}

export default ProductDetail;