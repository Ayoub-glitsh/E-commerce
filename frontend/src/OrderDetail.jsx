import { useParams, Link } from 'react-router-dom';
import { Package, Truck, CheckCircle2, ChevronLeft, MapPin } from 'lucide-react';
import useCartStore from './store/cartStore'; // Import du store

function OrderDetail() {
    const { id } = useParams();
    const orders = useCartStore((state) => state.orders) || [];
    const order = orders.find((o) => o.id === id);

    const getStatusColor = (status) => {
        switch(status) {
            case 'Livré': return 'bg-green-100 text-green-700 border-green-200';
            case 'En préparation': 
            case 'En transit': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Annulé': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (!order) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-20 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Commande introuvable</h2>
                <Link to="/orders" className="text-indigo-600 mt-4 inline-block font-medium hover:underline">
                    Retour à mes commandes
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6">
                <ChevronLeft size={16} />
                Retour aux commandes
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Commande {order.id}</h1>
                    <p className="text-gray-500 mt-1">Passée le {order.date}</p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border flex items-center gap-2 w-fit ${getStatusColor(order.status)}`}>
                    {order.status === 'Livré' && <CheckCircle2 size={16} />}
                    {(order.status === 'En transit' || order.status === 'En préparation') && <Truck size={16} />}
                    {order.status}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Liste des articles */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Package size={20} className="text-indigo-600"/>
                            Articles commandés
                        </h2>
                        
                        <div className="divide-y divide-gray-100">
                            {order.items.map((item, index) => (
                                <div key={index} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                                    <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                                        <img 
                                            src={Array.isArray(item.image) ? item.image[0] : item.image} 
                                            alt={item.name} 
                                            className="w-full h-full object-contain" 
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                        <p className="text-sm text-gray-500">{item.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">{(item.price * item.quantity).toFixed(2)} €</p>
                                        <p className="text-sm text-gray-500">Qté: {item.quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Résumé et Infos */}
                <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Résumé</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Sous-total</span>
                                <span>{(order.total - (order.total * 0.2 / 1.2)).toFixed(2)} €</span> {/* Calcul approximatif du HT selon votre 20% TVA */}
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Livraison</span>
                                <span>Gratuite</span>
                            </div>
                            <div className="pt-3 border-t border-gray-100 flex justify-between font-bold text-lg text-gray-900">
                                <span>Total (TTC)</span>
                                <span className="text-indigo-600">{order.total.toFixed(2)} €</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin size={20} className="text-indigo-600"/>
                            Adresse de livraison
                        </h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {order.address}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderDetail;