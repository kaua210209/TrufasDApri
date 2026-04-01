import { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Package, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [metricas, setMetricas] = useState({
    receitaTotal: 0,
    totalVendas: 0,
    totalEstoque: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetricas = async () => {
      setLoading(true);

      // Busca todas as vendas para somar o dinheiro
      const { data: vendas, error: erroVendas } = await supabase
        .from('vendas')
        .select('valor_total');

      // Busca os produtos para somar o estoque
      const { data: produtos, error: erroProdutos } = await supabase
        .from('produtos')
        .select('estoque');

      let receita = 0;
      let qtdVendas = 0;
      let estoque = 0;

      if (!erroVendas && vendas) {
        // Soma todo o valor_total de todas as vendas
        receita = vendas.reduce((acc, venda) => acc + Number(venda.valor_total || 0), 0);
        qtdVendas = vendas.length;
      }

      if (!erroProdutos && produtos) {
        // Soma todas as trufas que estão prontas
        estoque = produtos.reduce((acc, prod) => acc + Number(prod.estoque || 0), 0);
      }

      setMetricas({
        receitaTotal: receita,
        totalVendas: qtdVendas,
        totalEstoque: estoque
      });
      setLoading(false);
    };

    fetchMetricas();
  }, []);

  if (loading) return <div className="p-4 text-center text-slate-500">Calculando seus lucros...</div>;

  return (
    <div className="space-y-6 pb-20 text-graphite animate-in fade-in">
      
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-brand-pink to-pink-500 text-white p-6 rounded-3xl shadow-sm flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-2xl">
          <TrendingUp size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Meu Negócio</h2>
          <p className="text-xs text-pink-100 mt-1">Resumo do seu sucesso até agora.</p>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Card Principal: Receita Total (ocupa as 2 colunas) */}
        <div className="col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="bg-green-100 text-green-600 p-4 rounded-2xl">
            <DollarSign size={32} />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Receita Total</p>
            <h3 className="text-3xl font-black text-slate-800">
              R$ {metricas.receitaTotal.toFixed(2)}
            </h3>
          </div>
        </div>

        {/* Card: Total de Vendas */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-2">
          <div className="bg-blue-100 text-blue-500 w-fit p-3 rounded-xl mb-2">
            <ShoppingBag size={24} />
          </div>
          <p className="text-xs text-slate-400 font-medium">Vendas Realizadas</p>
          <h3 className="text-2xl font-black text-slate-800">{metricas.totalVendas}</h3>
        </div>

        {/* Card: Estoque Atual */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-2">
          <div className="bg-orange-100 text-orange-500 w-fit p-3 rounded-xl mb-2">
            <Package size={24} />
          </div>
          <p className="text-xs text-slate-400 font-medium">Trufas no Estoque</p>
          <h3 className="text-2xl font-black text-slate-800">{metricas.totalEstoque}</h3>
        </div>

      </div>

    </div>
  );
}