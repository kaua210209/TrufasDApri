import { useState, useEffect } from 'react';
import { Clock, Receipt, Calendar, CreditCard, Banknote } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Historico() {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVendas = async () => {
    setLoading(true);
    // Busca as vendas da mais recente para a mais antiga
    const { data, error } = await supabase
      .from('vendas')
      .select('*')
      .order('data_venda', { ascending: false });
      
    if (!error) setVendas(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchVendas();
  }, []);

  // Função para formatar a data bonitinha (Ex: 01/04/2026 às 14:30)
  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(data);
  };

  if (loading) return <div className="p-4 text-center text-slate-500">Buscando seu histórico...</div>;

  return (
    <div className="space-y-6 pb-20 text-graphite animate-in fade-in">
      
      {/* Cabeçalho */}
      <div className="bg-brand-pink text-white p-6 rounded-3xl shadow-sm flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-2xl">
          <Clock size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Histórico de Vendas</h2>
          <p className="text-xs text-pink-100 mt-1">Acompanhe tudo o que você já vendeu.</p>
        </div>
      </div>

      <div className="space-y-4">
        {vendas.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl text-center border border-slate-100 shadow-sm flex flex-col items-center gap-3">
            <Receipt className="text-slate-300" size={40} />
            <p className="text-sm text-slate-400">Nenhuma venda registrada ainda.<br/>Vá para o PDV e faça sua primeira venda!</p>
          </div>
        ) : (
          vendas.map((venda) => (
            <div key={venda.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              
              {/* Topo do Card da Venda */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar size={16} />
                  <span className="text-xs font-medium">{formatarData(venda.data_venda)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                  {venda.metodo_pagamento === 'Dinheiro' ? <Banknote size={14} /> : <CreditCard size={14} />}
                  {venda.metodo_pagamento}
                </div>
              </div>

              {/* Lista de Itens Vendidos */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Itens da Venda</p>
                {venda.itens_json && venda.itens_json.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-slate-700">
                      <span className="font-bold text-slate-900">{item.quantidade}x</span> {item.nome}
                    </span>
                    <span className="text-slate-500">R$ {item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Total da Venda */}
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">Total Pago:</span>
                <span className="text-lg font-black text-brand-pink">R$ {venda.valor_total.toFixed(2)}</span>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}