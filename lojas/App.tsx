import React, { useState, useMemo } from 'react';
import { STORES, CATEGORIES, AVAILABLE_CITIES } from './constants';
import StoreCard from './components/StoreCard';
import { Search, Zap, ShoppingBag, X, Utensils, Pizza, Beef, Fish, Beer, IceCream, CookingPot, MapPin, ChevronDown, Check, ArrowRight } from 'lucide-react';

// Simple mapping for icons based on string names from constants
const IconMap: Record<string, React.ReactNode> = {
  Utensils: <Utensils className="w-5 h-5" />,
  Beef: <Beef className="w-5 h-5" />,
  Pizza: <Pizza className="w-5 h-5" />,
  Fish: <Fish className="w-5 h-5" />,
  CookingPot: <CookingPot className="w-5 h-5" />,
  IceCream: <IceCream className="w-5 h-5" />,
  Beer: <Beer className="w-5 h-5" />,
};

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // City/Location State
  const [currentCity, setCurrentCity] = useState(AVAILABLE_CITIES[0]); // Default to first city (SP)
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');

  const filteredStores = useMemo(() => {
    return STORES.filter((store) => {
      // Filter by City first
      const matchesCity = store.city === currentCity.name;
      
      const matchesCategory = activeCategory === 'all' || store.category === activeCategory;
      const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCity && matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, currentCity]);

  const filteredCities = useMemo(() => {
    return AVAILABLE_CITIES.filter(city => 
      city.name.toLowerCase().includes(citySearchQuery.toLowerCase()) || 
      city.state.toLowerCase().includes(citySearchQuery.toLowerCase())
    );
  }, [citySearchQuery]);

  const handleSelectCity = (cityId: string) => {
    const selected = AVAILABLE_CITIES.find(c => c.id === cityId);
    if (selected) {
      setCurrentCity(selected);
      setIsCityModalOpen(false);
      setCitySearchQuery(''); // Reset search when closed
      setActiveCategory('all'); // Reset category when changing city
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans selection:bg-yellow-200 selection:text-black relative overflow-x-hidden">
      
      {/* Ambient Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-yellow-200/20 rounded-full blur-3xl opacity-60" />
        <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-3xl opacity-50" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* City Selection Modal */}
      {isCityModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setIsCityModalOpen(false)} 
          />
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-md relative shadow-2xl transform transition-all scale-100 animate-in fade-in zoom-in duration-300 flex flex-col max-h-[80vh] border border-gray-100">
            <div className="flex justify-between items-start mb-6">
               <div>
                  <div className="bg-yellow-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-yellow-600 rotate-3">
                     <MapPin className="w-6 h-6 fill-current" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Onde você está?</h3>
                  <p className="text-gray-500 text-sm mt-1">Selecione sua cidade para ver os melhores deliveries.</p>
               </div>
               <button 
                onClick={() => setIsCityModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors -mr-2 -mt-2 text-gray-400 hover:text-black"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Search Input for Cities */}
            <div className="relative mb-4 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar cidade..." 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none text-base font-medium placeholder:font-normal"
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2 overflow-y-auto no-scrollbar flex-1 -mx-2 px-2 pb-2">
              {filteredCities.length > 0 ? (
                filteredCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleSelectCity(city.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 group ${
                      currentCity.id === city.id 
                        ? 'border-black bg-black text-white shadow-lg' 
                        : 'border-transparent hover:bg-gray-50 text-gray-600 hover:text-black'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2.5 h-2.5 rounded-full ${currentCity.id === city.id ? 'bg-yellow-400' : 'bg-gray-200 group-hover:bg-gray-300'}`} />
                      <span className="font-semibold text-lg">
                        {city.name} <span className={`text-sm font-normal ${currentCity.id === city.id ? 'text-gray-400' : 'text-gray-400'}`}>- {city.state}</span>
                      </span>
                    </div>
                    {currentCity.id === city.id && <Check className="w-5 h-5 text-yellow-400" />}
                  </button>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhuma cidade encontrada.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 transition-all duration-300 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 gap-4">
            
            {/* Left Side: Logo */}
            <div 
              className="flex items-center gap-2.5 cursor-pointer shrink-0 group" 
              onClick={() => {setActiveCategory('all'); setSearchQuery('')}}
            >
              <div className="bg-black text-white p-2 rounded-xl shadow-lg shadow-yellow-200/50 group-hover:shadow-yellow-300/50 transition-all duration-300 group-hover:scale-105 group-hover:-rotate-3">
                <Zap className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-gray-900">PedeZap</span>
            </div>

            {/* Right Side: City Selector */}
            <button 
              onClick={() => {
                setCitySearchQuery(''); 
                setIsCityModalOpen(true);
              }}
              className="flex items-center gap-3 bg-white hover:bg-gray-50 px-4 py-2 rounded-full transition-all duration-300 border border-gray-200 shadow-sm hover:shadow-md group"
            >
              <div className="bg-red-50 p-1.5 rounded-full group-hover:bg-red-100 transition-colors">
                 <MapPin className="w-4 h-4 text-red-500 shrink-0" />
              </div>
              <div className="flex flex-col items-start text-sm overflow-hidden text-left leading-none gap-0.5">
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Você está em</span>
                <span className="font-bold text-gray-900 truncate max-w-[140px]">{currentCity.name}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-1 group-hover:translate-y-0.5 transition-transform" />
            </button>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 z-10">
        
        {/* Hero / Search Section */}
        <section className="mb-16 text-center md:text-left relative">
          <div className="max-w-4xl relative z-10">
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-8 tracking-tighter leading-[0.9] md:leading-[1.1]">
              O que você vai <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900">pedir hoje</span>
              <span className="text-gray-900"> em </span>
              <span className="relative inline-block whitespace-nowrap">
                <span className="relative z-10 px-2">{currentCity.name}?</span>
                <span className="absolute bottom-2 left-0 w-full h-4 bg-yellow-200 -z-0 rotate-[-1deg] rounded-full opacity-70"></span>
              </span>
            </h1>
            
            {/* Search Bar */}
            <div className="relative max-w-xl shadow-2xl shadow-gray-200/80 group focus-within:shadow-3xl focus-within:shadow-yellow-100/50 transition-all duration-500 rounded-2xl transform focus-within:-translate-y-1">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400 group-focus-within:text-black transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-14 pr-4 py-5 bg-white border-0 rounded-2xl leading-5 placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-lg transition-all font-medium"
                placeholder={`Buscar lojas, lanches, bebidas...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-black"
                >
                    <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Categories Scroller */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                Categorias
                <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                <span className="text-sm font-normal text-gray-500">Filtrar por tipo</span>
            </h2>
          </div>
          
          <div className="relative group/scroll">
            {/* Fade effects for scroll */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#F8F9FA] to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#F8F9FA] to-transparent z-10 pointer-events-none"></div>
            
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 px-1 snap-x">
                {CATEGORIES.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`snap-start flex items-center gap-3 px-6 py-4 rounded-2xl whitespace-nowrap transition-all duration-300 border shadow-sm hover:shadow-md ${
                    activeCategory === cat.id
                        ? 'bg-black text-white border-black shadow-lg shadow-gray-400/20 scale-105'
                        : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300 hover:bg-white hover:text-black'
                    }`}
                >
                    <div className={`${activeCategory === cat.id ? 'text-yellow-400' : 'text-gray-400'} transition-colors`}>
                        {IconMap[cat.iconName] || <Utensils className="w-5 h-5" />}
                    </div>
                    <span className="font-semibold text-base">{cat.name}</span>
                </button>
                ))}
            </div>
          </div>
        </section>

        {/* Store Grid */}
        <section>
          <div className="flex items-end justify-between mb-8 border-b border-gray-200 pb-4">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              {activeCategory === 'all' 
                ? 'Lojas recomendadas'
                : CATEGORIES.find(c => c.id === activeCategory)?.name}
            </h2>
            <span className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-600 font-semibold mb-1">
              {filteredStores.length} {filteredStores.length === 1 ? 'resultado' : 'resultados'}
            </span>
          </div>

          {filteredStores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredStores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-[2rem] border border-gray-100 border-dashed shadow-sm">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhuma loja por aqui</h3>
              <p className="text-gray-500 mb-8 max-w-xs mx-auto">Não encontramos lojas nesta categoria para {currentCity.name}.</p>
              <div className="flex justify-center gap-4">
                  <button 
                    onClick={() => {setSearchQuery(''); setActiveCategory('all');}}
                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-semibold transition-colors"
                  >
                    Limpar filtros
                  </button>
                  <button 
                    onClick={() => {
                      setIsCityModalOpen(true);
                      setCitySearchQuery('');
                    }}
                    className="px-6 py-2.5 bg-black text-white hover:bg-gray-800 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                  >
                    Mudar cidade
                  </button>
              </div>
            </div>
          )}
        </section>

      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-gray-200/60 py-16 mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
                <div className="flex items-center gap-2">
                    <div className="bg-black text-white p-1.5 rounded-lg">
                        <Zap className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">PedeZap</span>
                </div>
                <p className="text-gray-500 text-sm max-w-xs text-center md:text-left">
                    Conectando você aos melhores sabores da sua cidade com apenas alguns cliques.
                </p>
            </div>
            
            <div className="flex gap-8 text-sm font-semibold text-gray-600">
               <a href="#" className="hover:text-black transition-colors">Sobre</a>
               <a href="#" className="hover:text-black transition-colors">Termos</a>
               <a href="#" className="hover:text-black transition-colors">Privacidade</a>
            </div>

            <p className="text-gray-400 text-sm">
              © 2024 PedeZap.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;