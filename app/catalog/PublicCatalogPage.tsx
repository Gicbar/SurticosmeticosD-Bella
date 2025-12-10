"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, Sparkles, TrendingUp, Star, X, ShoppingBag, Plus, Minus } from "lucide-react";

export default function PublicCatalogPage({ products, categories }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [imageErrors, setImageErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleImageError = (productId) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setPriceRange([0, 500000]);
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing.quantity > 1) {
        return prev.map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);
  const getTotalPrice = () => cart.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "all" || p.category_name === selectedCategory;
    const matchPrice = p.sale_price >= priceRange[0] && p.sale_price <= priceRange[1];
    return matchSearch && matchCategory && matchPrice;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-violet-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-pink-500 p-1.5 shadow-md">
              <img
                src="/logo.png"
                alt="D'Bella Logo"
                className="w-full h-full object-contain rounded-full bg-white"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="w-full h-full bg-white rounded-full flex items-center justify-center text-xs font-bold text-violet-600">DB</div>';
                }}
              />
            </div>
            <div>
              <h1 className="text-xl font-light tracking-tight">
                Surticosméticos <span className="font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">D'Bella</span>
              </h1>
              <p className="text-xs text-violet-600/70 font-medium">Belleza auténtica, resultados reales</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-violet-600 bg-violet-100 px-3 py-1.5 rounded-full font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>{products.length} productos premium</span>
            </div>
            {/* Cart Button */}
            <Button
              variant="outline"
              size="sm"
              className="relative h-9 px-3 border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-300 transition-all"
              onClick={() => setShowCart(!showCart)}
            >
              <ShoppingBag className="w-4 h-4" />
              {getTotalItems() > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-[10px] bg-pink-500 text-white border-2 border-white">
                  {getTotalItems()}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed right-4 top-20 z-50 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-violet-200 max-h-[80vh] overflow-hidden flex flex-col animate-in slide-in-from-right-2">
          <div className="p-4 border-b border-violet-100 flex items-center justify-between bg-white/50">
            <h3 className="font-semibold text-violet-700 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Tu Pedido
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-violet-400 hover:text-violet-600"
              onClick={() => setShowCart(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-10 h-10 text-violet-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Tu carrito está vacío</p>
                <p className="text-xs text-gray-400 mt-1">¡Agrega productos para empezar!</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex gap-3 p-3 bg-violet-50/50 rounded-xl border border-violet-100 hover:bg-violet-50 transition-colors">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-violet-200 shadow-sm">
                    {item.image_url && !imageErrors[item.id] ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(item.id)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-violet-500 bg-gradient-to-br from-violet-50 to-pink-50">
                        <Sparkles className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-violet-600 font-semibold">
                      {item.sale_price.toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                        minimumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-white rounded-lg border border-violet-200 p-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-violet-100"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Minus className="w-3 h-3 text-violet-600" />
                    </Button>
                    <span className="text-sm font-medium w-6 text-center text-gray-800">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-violet-100"
                      onClick={() => addToCart(item)}
                    >
                      <Plus className="w-3 h-3 text-violet-600" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          {cart.length > 0 && (
            <div className="p-4 border-t border-violet-100 bg-white/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Total:</span>
                <span className="text-lg font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                  {getTotalPrice().toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                  })}
                </span>
              </div>
              <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:shadow-lg transition-all h-10 text-sm font-medium">
                <Sparkles className="w-4 h-4 mr-2" />
                Agenda Tu Pedido por WhatsApp
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2 font-medium">
                Te confirmaremos tu pedido una vez nos contactes
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Smart Filters */}
        <Card className="mb-5 p-3 bg-white/70 backdrop-blur-md border-violet-100 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-0 space-y-3">
            <div className="relative group">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-violet-400 group-focus-within:text-violet-600 transition-colors" />
              <Input
                placeholder="¿Qué producto buscas hoy?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-white/80 border-violet-200 focus:border-violet-400 focus:ring-violet-400/20 text-sm"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0 text-violet-400 hover:text-violet-600"
                  onClick={() => setSearch("")}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="w-4 h-4 text-violet-400" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-9 bg-white/80 border-violet-200 text-sm">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 flex-1 sm:max-w-xs">
                <span className="text-xs text-violet-600 font-medium whitespace-nowrap">Precio</span>
                <Slider
                  min={0}
                  max={500000}
                  step={5000}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="flex-1"
                />
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full font-medium min-w-[70px] text-center">
                  ${(priceRange[1] / 1000).toFixed(0)}k
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-300 transition-all"
                onClick={clearFilters}
              >
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-violet-600/80 font-medium">
            {loading ? "Cargando..." : `${filtered.length} productos encontrados`}
          </p>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-violet-400 text-violet-400" />
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-xl bg-gradient-to-br from-violet-100 to-pink-100 animate-pulse" />
              ))
            : filtered.map((product) => (
              <Card
                key={product.id}
                className="group relative overflow-hidden border border-violet-100 bg-white/90 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
                onClick={() => {
                  setSelectedProduct(product);
                  setShowProductModal(true);
                }}
              >
                <div className="aspect-[4/5] w-full bg-gradient-to-br from-violet-50 to-pink-50 overflow-hidden relative">
                  {product.image_url && !imageErrors[product.id] ? (
                    <img
                      src={product.image_url}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt={product.name}
                      loading="lazy"
                      onError={() => handleImageError(product.id)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-violet-400" />
                    </div>
                  )}
                  {product.category_name && (
                    <Badge
                      variant="secondary"
                      className="absolute top-2 left-2 px-2 py-0 h-5 text-[10px] font-medium bg-violet-600/90 text-white backdrop-blur-sm border border-white/20"
                    >
                      {product.category_name}
                    </Badge>
                  )}
                  {product.stock <= 10 && (
                    <Badge
                      variant="secondary"
                      className="absolute bottom-2 left-2 px-2 py-0 h-5 text-[10px] font-medium bg-pink-500/90 text-white backdrop-blur-sm border border-white/20 animate-pulse"
                    >
                      ¡Últimos {product.stock}!
                    </Badge>
                  )}
                </div>
                <CardContent className="p-2.5 space-y-1">
                  <h3 className="text-xs font-medium leading-tight line-clamp-2 text-gray-800 group-hover:text-violet-700 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-gray-500 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-sm font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                      {product.sale_price.toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                        minimumFractionDigits: 0,
                      })}
                    </p>
                    <Button
                      size="sm"
                      className="h-6 px-2 text-xs bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:shadow-md transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-100 flex items-center justify-center">
              <Search className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">No encontramos resultados</h3>
            <p className="text-sm text-gray-500">Intenta con otros términos o categorías</p>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {showProductModal && selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in-0 zoom-in-95"
          onClick={() => setShowProductModal(false)}
        >
          <Card
            className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-xl border-violet-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-0">
              <div className="relative aspect-square w-full bg-gradient-to-br from-violet-50 to-pink-50 overflow-hidden">
                {selectedProduct.image_url && !imageErrors[selectedProduct.id] ? (
                  <img
                    src={selectedProduct.image_url}
                    className="w-full h-full object-cover"
                    alt={selectedProduct.name}
                    onError={() => handleImageError(selectedProduct.id)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="w-16 h-16 text-violet-400" />
                  </div>
                )}
                {selectedProduct.category_name && (
                  <Badge className="absolute top-3 left-3 px-3 py-0.5 h-7 text-xs font-medium bg-violet-600/90 text-white backdrop-blur-sm border border-white/20">
                    {selectedProduct.category_name}
                  </Badge>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{selectedProduct.name}</h3>
                    <p className="text-sm text-gray-500">{selectedProduct.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-violet-400 hover:text-violet-600"
                    onClick={() => setShowProductModal(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                    {selectedProduct.sale_price.toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    })}
                  </p>
                  <Button
                    size="sm"
                    className="h-9 px-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:shadow-md transition-all"
                    onClick={() => {
                      addToCart(selectedProduct);
                      setShowProductModal(false);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar al carrito
                  </Button>
                </div>
                <div className="pt-3 border-t border-violet-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-violet-600">Stock disponible:</span> {selectedProduct.stock}
                  </p>
                  {selectedProduct.additional_info && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium text-violet-600">Información adicional:</span> {selectedProduct.additional_info}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
