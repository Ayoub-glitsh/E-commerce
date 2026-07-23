import { SlidersHorizontal, Search, ArrowUpDown } from 'lucide-react';
import { categories } from './mocks/data';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function Products() {

    const [page, setPage] = useState(1);
    const [category, setCategory] = useState("Tout");
    const [priceMax, setPriceMax] = useState(200);
    const [rating, setRating] = useState(0);

    const [products, setProducts] = useState([]);
    const [search,setSearch]=useState("");
    const [sort,setSort]=useState("populaire");
    
    const [currentPage,setCurrentPage]=useState(1);
    const productsPerPage=8;

    const lastProduct=productsPerPage*currentPage;
    const firstProduct=lastProduct-productsPerPage;
    useEffect(() => {
        async function loadProducts() {
            const response = await fetch("/api/products");
            const data = await response.json();
            setProducts(data);
        }

        loadProducts();
    }, []);


    useEffect(()=>{
          setCurrentPage(1);
    },[category,rating,search,sort,priceMax])
    

    const ratings = [
        { label: "Tout", value: 0 },
        { label: "⭐ 4+", value: 4 },
        { label: "⭐ 4.5+", value: 4.5 },
        { label: "⭐ 4.9+", value: 4.9 }
    ];

    function reset() {
        setPage(1);
        setCategory("Tout");
        setPriceMax(200);
        setRating(0);
    }

    const changePrice = (e) => {
        setPriceMax(Number(e.target.value));
        setPage(1);
    };

    const handleSearch=(e)=>{       
      setSearch(e.target.value);      
    }
    const handleSort=(e)=>{
         setSort(e.target.value);
    }

 
   
const filteredProducts = products
  .filter((product) => {
    if (product.price >= priceMax) return false;
    if (product.rating < rating) return false;
    if (!product.name.toLowerCase().includes(search.toLowerCase()))
      return false;

    if (category === "Tout") return true;

    return product.category === category;
  })
  .sort((a, b) => {
    if (sort === "prixC") return a.price - b.price;
    if (sort === "prixD") return b.price - a.price;
    if (sort === "topR") return b.rating - a.rating;
    return 0;

  });

  const currentProduct=filteredProducts.slice(firstProduct,lastProduct);
  const totalPages=Math.ceil(filteredProducts.length/productsPerPage);


    return (
        <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">

            {/* bar side*/}

            <aside className="w-64 bg-white rounded-2xl border border-gray-200 p-6 h-fit">

                <div className="flex items-center gap-1.5">
                    <SlidersHorizontal size={14} className="text-gray-400" />

                    <h3 className="text-sm font-semibold text-gray-900">
                        Filtres
                    </h3>

                    <button
                        onClick={reset}
                        className="ml-auto text-xs text-indigo-500 hover:text-indigo-600 font-medium"
                    >
                        Réinitialiser
                    </button>
                </div>

                {/* Categories */}

                <div className="mt-6">

                    <h3 className="mb-3 text-sm font-semibold text-gray-600">
                        Catégorie
                    </h3>

                    {categories.map((cat) => (
                        <div key={cat.id}>
                            <button
                                onClick={() => {
                                    setCategory(cat.name);
                                    setPage(1);
                                    
                                }}
                                className={`
                                    w-full
                                    text-left
                                    rounded-lg
                                    px-3
                                    py-2
                                    text-xs
                                    font-medium
                                    transition-colors
                                    ${
                                        category === cat.name
                                            ? "bg-indigo-50 text-indigo-600"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }
                                `}
                            >
                                {cat.name}
                            </button>

                        </div>
                    ))}

                </div>

                {/* Price */}

                <div className="mt-6">

                    <h3 className="text-sm text-gray-600 font-semibold">
                        Prix max — {priceMax} €
                    </h3>

                    <input
                        type="range"
                        min={0}
                        max={200}
                        value={priceMax}
                        onChange={changePrice}
                        className="w-full accent-indigo-500 h-1 mt-2"
                    />

                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>0 €</span>
                        <span>200 €</span>
                    </div>

                </div>

                {/* Rating */}

                <div className="mt-6">

                    <h3 className="mb-3 text-sm font-semibold text-gray-600">
                        Note minimum
                    </h3>

                    {ratings.map((rate) => (

                        <div key={rate.value}>

                            <button
                                onClick={() => {
                                    setRating(rate.value);
                                    setPage(1);
                                }}
                                className={`
                                    w-full
                                    text-left
                                    rounded-lg
                                    px-3
                                    py-2
                                    text-xs
                                    font-medium
                                    transition-colors
                                    ${
                                        rating === rate.value
                                            ? "bg-indigo-50 text-indigo-600"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }
                                `}
                            >
                                {rate.label}
                            </button>

                        </div>

                    ))}

                </div>

            </aside>


            <div className="flex-1">
                <div className="flex gap-4 mb-8">

                    <div className="relative flex-1">

                        <Search
                            size={14}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            type="text"
                            placeholder="Rechercher un produit..."
                            className="w-full border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
                            onChange={handleSearch}
                            value={search}
                        />

                    </div>

                    <div className="relative">

                        <ArrowUpDown
                            size={13}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />

                        <select className="pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none bg-white cursor-pointer text-gray-600" value={sort} onChange={handleSort}>
                            <option value="populaire">Popularité</option>
                            <option value="prixC">Prix croissant</option>
                            <option value="prixD">Prix décroissant</option>
                            <option value="topR">Meilleure note</option>

                        </select>

                    </div>

                </div>

                {/* filtre des produoits */}

                  
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredProducts.length === 0 ? (
                        <div className="col-span-full text-center py-20">
                            <h2 className="text-3xl font-bold">🔍No products found</h2>
                            <p className="text-gray-500 mt-2">
                                Try changing your search or filters.
                            </p>
                        </div>
                     ) : (
                        currentProduct.map((product) => (
                            <Link to={`/product-detail/${product.id}`} ><div
                            key={product.id}
                            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                        >

                            <div className="h-56 bg-gray-100 overflow-hidden">

                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />

                            </div>

                            <div className="p-4">

                                <h3 className="font-semibold text-gray-900 text-sm">
                                    {product.name}
                                </h3>

                                <p className="text-xs text-gray-500 mt-1">
                                    {product.category}
                                </p>

                                <div className="flex justify-between items-center mt-4">

                                    <span className="text-indigo-600 font-bold">
                                        {product.price} €
                                    </span>

                                    <span className="text-yellow-500 text-sm">
                                        ⭐ {product.rating}
                                    </span>

                                </div>

                                    </div>

                        </div></Link>  
                        
                  ))
           )}

           
        </div>

        <div className='flex items-center justify-center mt-7 gap-3'>
               {
                   [...Array(totalPages)].map((_,index)=>(
                      <button onClick={()=>setCurrentPage(index+1)} className={`w-10 h-10 rounded-2xl ${currentPage===index+1?"bg-indigo-600 text-white":"bg-gray-100"}`}>  
                          {index+1}
                      </button>
                    

                   ))
               }
        </div>

       
                </div>
            </div>

    );
}

export default Products;