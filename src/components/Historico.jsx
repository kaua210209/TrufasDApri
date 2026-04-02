import { useState, useEffect } from 'react';
import { Clock, Receipt, Calendar, CreditCard, Banknote, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Historico() {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVendas = async () => {
    setLoading(true);
    // Busca as vendas usando a coluna correta 'data_venda'
    const { data, error } = await supabase
      .from('vendas')
      .select('*')
      .order('data_venda', { ascending: false });
      
    if (!error) setVendas(data || []);
    setLoading(false);
  };

  // Função para apagar TODO o histórico
  const limparHistorico = async () => {
    const confirmar = window.confirm("⚠️ Tem certeza que deseja APAGAR TODO o histórico de vendas? Esta ação não pode ser desfeita.");
    
    if (confirmar) {
      // No Supabase, para deletar tudo precisamos de um filtro. 
      // Como o ID é um UUID, filtramos por IDs que não sejam vazios.
      const { error } = await supabase
        .from('vendas')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); 

      if (error) {
        alert("Erro ao limpar histórico: " + error.message);
      } else {
        setVendas([]); // Limpa a lista na tela imediatamente
        alert("Histórico apagado com sucesso!");
      }
    }
  };

  useEffect(() => {
    fetchVendas();
  }, []);

  const formatarData = (dataString) => {
    if(!dataString) return "";
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(data);
  };

  if (loading) return <div className="p-4 text-center text-slate-500">Buscando seu histórico...</div>;

  return (
    <div className="space-y-6 pb-20 text-graphite animate-in fade-in">
      
      {/* Cabeçalho com Botão de Limpar */}
      <div className="bg-brand-pink text-white p-6 rounded-3xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl">
            <Clock size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Histórico</h2>
            <p className="text-xs text-pink-100 mt-1">Suas vendas salvas.</p>
          </div>
        </div>
        
        {/* Botão de Lixeira */}
        {vendas.length > 0 && (
          <button 
            onClick={limparHistorico}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors"
            title="Limpar histórico"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {vendas.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl text-center border border-slate-100 shadow-sm flex flex-col items-center gap-3">
            <Receipt className="text-slate-300" size={40} />
            <p className="text-sm text-slate-400">Nenhuma venda registrada ainda.</p>
          </div>
        ) : (
          vendas.map((venda) => (
            <div key={venda.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              
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

              <div className="space-y-2">
                {venda.itens_json && venda.itens_json.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-slate-700">
                      <span className="font-bold text-slate-900">{item.quantidade}x</span> {item.nome}
                    </span>
                    <span className="text-slate-500">R$ {Number(item.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">Total Pago:</span>
                <span className="text-lg font-black text-brand-pink">R$ {Number(venda.valor_total).toFixed(2)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

    </div>
  );
}
