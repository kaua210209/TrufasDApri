import { useState } from 'react';
import { Home, Package, CookingPot, ShoppingCart, Clock } from 'lucide-react';
import Producao from './components/Producao';
import Vitrine from './components/Vitrine';
import PDV from './components/PDV';
import Historico from './components/Historico';
import Dashboard from './components/Dashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Array com as configurações do nosso menu inferior
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Início' },
    { id: 'vitrine', icon: Package, label: 'Estoque' },
    { id: 'producao', icon: CookingPot, label: 'Produção' },
    { id: 'vendas', icon: ShoppingCart, label: 'PDV' },
    { id: 'historico', icon: Clock, label: 'Histórico' }
  ];

  // Função simples para renderizar a tela correta baseada na aba ativa
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'vitrine': return <Vitrine />;
      case 'producao': return <Producao />;
      case 'vendas': return <PDV />;
      case 'historico': return <Historico />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-base pb-24 text-graphite font-sans">
      
      {/* Área de Conteúdo (onde as abas vão aparecer) */}
      <main className="p-6">
        {renderContent()}
      </main>

      {/* Navegação Inferior Fixa */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${
                isActive ? 'text-brand-pink' : 'text-slate-400'
              }`}
            >
              <Icon size={24} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
    </div>
  );
}