import { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Users, Settings, 
  TrendingUp, Package, DollarSign, Bell, Search, 
  Sparkles, ArrowUpRight, MoreVertical, X, CheckCircle2 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useCartStore from './store/cartStore';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [productsCount, setProductsCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  const orders = useCartStore((state) => state.orders) || [];

  useEffect(() => {
      async function loadProducts() {
          try {
              const res = await fetch('/api/products');
              const data = await res.json();
              setProductsCount(data.length);
          } catch (error) {
              console.log(error);
          }
      }
      loadProducts();
  }, []);

  useEffect(() => {
      function handleClickOutside(event) {
          if (notifRef.current && !notifRef.current.contains(event.target)) {
              setShowNotifs(false);
          }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const uniqueCustomers = new Set(orders.map(order => order.customer || order.address)).size;

  const stats = [
    { title: "Revenu Total", value: `${totalRevenue.toFixed(2)} €`, change: "+12.5%", isPositive: true, icon: DollarSign },
    { title: "Commandes", value: totalOrders.toString(), change: "+5.2%", isPositive: true, icon: ShoppingBag },
    { title: "Clients uniques", value: uniqueCustomers.toString(), change: "+2.4%", isPositive: true, icon: Users },
    { title: "Produits en catalogue", value: productsCount.toString(), change: "Actif", isPositive: true, icon: Package },
  ];

  const pendingOrders = orders.filter(o => o.status === "En préparation" || o.status === "Pending");

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Livré': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Livré</span>;
      case 'En préparation': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">En préparation</span>;
      case 'En transit': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">En transit</span>;
      case 'Annulé': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Annulé</span>;
      default: return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">{status || "En préparation"}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Link to="/" className="text-xl font-extrabold text-indigo-600 flex items-center gap-2">
            <Package className="text-indigo-600" />
            AdminPro
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <LayoutDashboard size={20} /> Vue d'ensemble
          </button>
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${activeTab === 'orders' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <ShoppingBag size={20} /> Commandes
            {pendingOrders.length > 0 && (
                <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingOrders.length}
                </span>
            )}
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4 flex-1">
             <h2 className="text-lg font-bold text-gray-800">Interface Administrateur</h2>
          </div>
          <div className="flex items-center gap-5">
            
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 text-gray-400 hover:text-indigo-600 transition-colors"
              >
                <Bell size={20} />
                {pendingOrders.length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] text-white font-bold">
                        {pendingOrders.length}
                    </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900">Notifications</h3>
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">{pendingOrders.length} nouvelles</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {pendingOrders.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 text-sm">
                        Aucune nouvelle notification.
                      </div>
                    ) : (
                      pendingOrders.map((notif, idx) => (
                        <div key={idx} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 cursor-pointer" onClick={() => {setActiveTab('orders'); setShowNotifs(false);}}>
                           <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                              <ShoppingBag size={18} className="text-indigo-600" />
                           </div>
                           <div>
                             <p className="text-sm font-semibold text-gray-900">Nouvelle commande ({notif.id})</p>
                             <p className="text-xs text-gray-500 mt-1">{notif.customer || "Client"} a passé une commande de {notif.total.toFixed(2)}€.</p>
                             <p className="text-xs text-indigo-600 mt-2 font-medium">{notif.date}</p>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              AD
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8">
          
      
          {activeTab === 'dashboard' && (
              <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
                    <p className="text-gray-500 text-sm mt-1">Vos statistiques en temps réel basées sur les ventes.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div key={index} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <Icon size={20} className="text-indigo-600" />
                          </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-1 relative overflow-hidden shadow-xl h-full">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/30 rounded-full blur-3xl"></div>
                      <div className="bg-white/10 backdrop-blur-md rounded-[22px] p-6 relative h-full border border-white/10">
                        <div className="flex items-center gap-2 mb-6">
                          <Sparkles className="text-indigo-300" size={24} />
                          <h2 className="text-lg font-bold text-white">Insights IA</h2>
                        </div>
                        
                        <div className="space-y-4">
                            {totalOrders === 0 ? (
                                <p className="text-sm text-indigo-200/70">L'IA analysera vos données dès votre première vente !</p>
                            ) : (
                                <>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                      <h3 className="text-sm font-semibold text-indigo-100 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                        Ventes en hausse
                                      </h3>
                                      <p className="text-sm text-indigo-200/70 mt-2">
                                        Vous avez réalisé {totalOrders} commande(s) pour {totalRevenue.toFixed(2)} €. Continuez ainsi !
                                      </p>
                                    </div>
                                    {pendingOrders.length > 0 && (
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setActiveTab('orders')}>
                                          <h3 className="text-sm font-semibold text-indigo-100 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                                            Action Requise
                                          </h3>
                                          <p className="text-sm text-indigo-200/70 mt-2">
                                            Vous avez {pendingOrders.length} commande(s) en attente. Cliquez ici pour les gérer.
                                          </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
                      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900">Commandes Récentes</h2>
                        <button onClick={() => setActiveTab('orders')} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">Voir tout</button>
                      </div>
                      
                      <div className="overflow-x-auto flex-1">
                        {orders.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">Aucune commande pour le moment.</div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Commande</th>
                                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {orders.slice(0, 5).map((order) => (
                                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-indigo-600 text-sm">
                                        <Link to={`/order-detail/${order.id}`}>{order.id}</Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.customer || "Client"}</td>
                                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{order.total.toFixed(2)} €</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
          )}

         
          {activeTab === 'orders' && (
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Toutes les commandes</h1>
                    <p className="text-gray-500 text-sm mt-1">Gérez et suivez l'ensemble des commandes de votre boutique.</p>
                  </div>
                  
                  <div className="flex gap-3">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                              type="text" 
                              placeholder="Rechercher (ID, Client)..."
                              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 w-full sm:w-64 shadow-sm"
                          />
                      </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        {orders.length === 0 ? (
                            <div className="p-20 text-center flex flex-col items-center">
                                <ShoppingBag size={48} className="text-gray-300 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900">Aucune commande</h3>
                                <p className="text-gray-500 mt-2">Votre historique de commandes est vide.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID Commande</th>
                                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
                                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Articles</th>
                                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {orders.map((order) => (
                                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 font-semibold text-indigo-600 text-sm">
                                        <Link to={`/order-detail/${order.id}`} className="hover:underline">{order.id}</Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{order.customer || "Client Privé"}</div>
                                        <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[150px]">{order.address}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{order.date}</td>
                                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {order.items.length} {order.items.length > 1 ? 'articles' : 'article'}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{order.total.toFixed(2)} €</td>
                                    <td className="px-6 py-4 text-right">
                                      <Link to={`/order-detail/${order.id}`}>
                                        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                            Détails
                                        </button>
                                      </Link>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                        )}
                    </div>
                </div>
              </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;