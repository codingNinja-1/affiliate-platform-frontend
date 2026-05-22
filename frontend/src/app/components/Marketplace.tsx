"use client";

import { useEffect, useState } from "react";
import Link from "@/app/components/NoPrefetchLink";

export default function Marketplace() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState("NGN");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    const fetchProducts = async () => {
      try {
        const res = await fetch(`/api/affiliate/products?limit=30&sort=commission_desc`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProducts(data.data || []);
        }
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.vendor_name?.toLowerCase().includes(q)
    );
  });

  const currencySymbol = currency === "NGN" ? "₦" : currency === "USD" ? "$" : currency === "GBP" ? "£" : currency === "EUR" ? "€" : currency + " ";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-blue-900 rounded-xl p-6 mb-8 text-center text-white">
          <h1 className="text-2xl font-bold mb-1">🛒 Product Marketplace</h1>
          <p className="text-sm">Promote digital products & earn commissions!</p>
        </div>
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search products by name or vendor..."
            className="w-full rounded-lg border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No products found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map(product => {
              let productImage = product.image || (product.images && product.images.length > 0 ? product.images[0] : null);
              if (productImage) {
                if (!productImage.startsWith("http")) {
                  const filename = productImage.split("/").pop();
                  productImage = `https://snow-mantis-616662.hostingersite.com/storage/products/${filename}`;
                }
              }
              const commission = product.commission_amount || product.commission || 0;
              return (
                <div key={product.id} className="bg-white rounded-xl border shadow-sm hover:shadow-lg transition overflow-hidden flex flex-col">
                  <div className="relative h-40 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                    {productImage ? (
                      <img src={productImage} alt={product.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <div className="w-16 h-16 bg-blue-200 rounded-lg" />
                    )}
                    {product.is_hot && <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">HOT</span>}
                    {product.is_new && <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-gray-900 text-base line-clamp-2 mb-1">{product.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <span className="font-medium">{product.vendor_name || product.vendor || "Unknown Vendor"}</span>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <div className="text-xs text-gray-500">Price</div>
                        <div className="font-bold text-lg text-blue-700">{currencySymbol}{product.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="text-xs text-green-600 font-semibold mt-1">{product.commission_rate || product.commission_percent || 0}% Commission<br /><span className="text-gray-500 font-normal">Earn {currencySymbol}{commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                      </div>
                      <Link href={`/products/${product.slug}`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-xs transition">Promote Product</Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
