import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Banknote, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PDV() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metodoPagamento, setMetodoPagamento] = useState('PIX');

  // Busca apenas produtos que tenham estoque na vitrine
  const fetchProdutos = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('produtos').select('*').gt('estoque', 0).order('nome');
    if (!error) setProdutos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const adicionarAoCarrinho = (produto) => {
    const itemExistente = carrinho.find(item => item.id === produto.id);
    
    if (itemExistente) {
      if (itemExistente.quantidade < produto.estoque) {
        setCarrinho(carrinho.map(item => 
          item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
        ));
      } else {
        alert("Você não tem mais desse produto no estoque!");
      }
    } else {
      setCarrinho([...carrinho, { ...produto, quantidade: 1 }]);
    }
  };

  const alterarQuantidade = (id, delta) => {
    setCarrinho(carrinho.map(item => {
      if (item.id === id) {
        const novaQtd = item.quantidade + delta;
        if (novaQtd > 0 && novaQtd <= item.estoque) {
          return { ...item, quantidade: novaQtd };
        }
      }
      return item;
    }));
  };

  const removerDoCarrinho = (id) => {
    setCarrinho(carrinho.filter(item => item.id !== id));
  };

  const totalCarrinho = carrinho.reduce((acc, item) => acc + (item.preco_venda * item.quantidade), 0);

  const finalizarVenda = async () => {
    if (carrinho.length === 0) return alert("O carrinho está vazio!");

    // 1. Salvar a Venda no Banco de Dados
    const itensVenda = carrinho.map(item => ({
      produtoId: item.id,
      nome: item.nome,
      quantidade: item.quantidade,
      preco_unitario: item.preco_venda,
      subtotal: item.quantidade * item.preco_venda
    }));

    const { error: erroVenda } = await supabase.from('vendas').insert([{
      valor_total: totalCarrinho,
      metodo_pagamento: metodoPagamento,
      itens_json: itensVenda
    }]);

    if (erroVenda) {
      console.error(erroVenda);
      return alert("Erro ao registrar a venda no sistema.");
    }

    // 2. Dar baixa automática no Estoque da Vitrine
    for (const item of carrinho) {
      const novoEstoque = item.estoque - item.quantidade;
      await supabase.from('produtos').update({ estoque: novoEstoque }).eq('id', item.id);
    }

    alert("Venda finalizada com sucesso! 🎉 Dinheiro no caixa!");
    setCarrinho([]); // Limpa o carrinho
    fetchProdutos(); // Atualiza a tela para mostrar o novo estoque
  };

  if (loading) return <div className="p-4 text-center text-slate-500">Abrindo o caixa...</div>;

  return (
    <div className="space-y-6 pb-20 text-graphite animate-in fade-in">
      
      {/* Cabeçalho */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-2xl">
          <Banknote size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Ponto de Venda</h2>
          <p className="text-xs text-slate-400 mt-1">Registre suas vendas rapidamente.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Lado Esquerdo: Produtos Disponíveis */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-700 ml-2">Vitrine de Hoje</h3>
          {produtos.length === 0 ? (
            <div className="bg-white p-6 rounded-3xl text-center border border-slate-100 shadow-sm text-sm text-slate-400">
              Sua vitrine está vazia. Vá em "Estoque" para produzir mais trufas!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {produtos.map(produto => (
                <button 
                  key={produto.id} 
                  onClick={() => adicionarAoCarrinho(produto)}
                  className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-2 active:scale-95 transition-transform"
                >
                  <div className="bg-brand-pink/10 text-brand-pink text-xs font-bold px-2 py-1 rounded-lg w-full">
                    {produto.estoque} em estoque
                  </div>
                  <h4 className="font-bold text-sm text-slate-700 mt-2">{produto.nome}</h4>
                  <span className="text-sm font-black text-slate-900">R$ {produto.preco_venda.toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lado Direito: Carrinho de Compras */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 space-y-4 flex flex-col h-fit">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <ShoppingCart size={20} /> Carrinho
          </h3>

          <div className="space-y-2 min-h-[150px]">
            {carrinho.length === 0 ? (
              <p className="text-center text-xs text-slate-400 mt-10">Adicione produtos para vender.</p>
            ) : (
              carrinho.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-700 leading-tight">{item.nome}</p>
                    <p className="text-xs font-semibold text-brand-pink mt-1">R$ {(item.preco_venda * item.quantidade).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => alterarQuantidade(item.id, -1)} className="bg-white p-1 rounded-lg shadow-sm text-slate-400 active:scale-95"><Minus size={16} /></button>
                    <span className="font-bold text-sm w-4 text-center">{item.quantidade}</span>
                    <button onClick={() => alterarQuantidade(item.id, 1)} className="bg-white p-1 rounded-lg shadow-sm text-slate-700 active:scale-95"><Plus size={16} /></button>
                    <button onClick={() => removerDoCarrinho(item.id)} className="ml-2 text-red-300 hover:text-red-500"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 ml-2 mb-1 block">Pagamento</label>
              <select 
                value={metodoPagamento} 
                onChange={(e) => setMetodoPagamento(e.target.value)}
                className="w-full bg-slate-50 p-3 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-brand-pink/50"
              >
                <option value="PIX">PIX</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
              </select>
            </div>

            <div className="flex justify-between items-end bg-slate-900 text-white p-4 rounded-2xl">
              <span className="text-sm text-slate-300">Total a cobrar:</span>
              <span className="text-2xl font-black">R$ {totalCarrinho.toFixed(2)}</span>
            </div>

            <button 
              onClick={finalizarVenda}
              className={`w-full py-4 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all active:scale-95 ${
                carrinho.length > 0 ? 'bg-brand-pink text-white shadow-md shadow-brand-pink/30' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle size={22} /> Finalizar Venda
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}