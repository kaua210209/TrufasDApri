import { useState, useEffect } from 'react';
import { Store, Plus, Minus, PackagePlus, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Vitrine() {
  const [produtos, setProdutos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar os inputs de produção de cada card
  const [qtdProduzir, setQtdProduzir] = useState({});

  const fetchData = async () => {
    setLoading(true);
    // Busca produtos
    const { data: dataProd } = await supabase.from('produtos').select('*').order('nome');
    if (dataProd) setProdutos(dataProd);

    // Busca insumos (para checar o estoque antes de produzir)
    const { data: dataIns } = await supabase.from('insumos').select('*');
    if (dataIns) setInsumos(dataIns);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Função para mudar o input de quantidade de um produto específico
  const handleQtdChange = (produtoId, valor) => {
    setQtdProduzir({ ...qtdProduzir, [produtoId]: valor });
  };

  const handleProduzirLote = async (produto) => {
    const quantidade = parseInt(qtdProduzir[produto.id]);
    
    if (!quantidade || quantidade <= 0) {
      return alert("Digite uma quantidade válida para produzir.");
    }

    if (!produto.receita_json || produto.receita_json.length === 0) {
      return alert("Este produto não tem uma receita cadastrada.");
    }

    // 1. CHECAGEM DE ESTOQUE: Verificando se temos insumos suficientes
    let insumosFaltantes = [];
    const deducoes = produto.receita_json.map(itemReceita => {
      const insumoBanco = insumos.find(i => i.id === itemReceita.insumoId);
      const qtdNecessaria = itemReceita.qtd * quantidade; // Qtd da receita * trufas feitas

      if (!insumoBanco || insumoBanco.peso_total_gramas < qtdNecessaria) {
        insumosFaltantes.push(insumoBanco ? insumoBanco.nome : 'Insumo excluído');
      }

      return {
        id: itemReceita.insumoId,
        novoPeso: insumoBanco ? insumoBanco.peso_total_gramas - qtdNecessaria : 0
      };
    });

    if (insumosFaltantes.length > 0) {
      return alert(`Estoque insuficiente dos seguintes insumos: ${insumosFaltantes.join(', ')}`);
    }

    // 2. DAR BAIXA NOS INSUMOS
    for (const deducao of deducoes) {
      await supabase.from('insumos')
        .update({ peso_total_gramas: deducao.novoPeso })
        .eq('id', deducao.id);
    }

    // 3. ADICIONAR AS TRUFAS NA VITRINE (Estoque do Produto)
    const novoEstoqueProduto = (produto.estoque || 0) + quantidade;
    const { error } = await supabase.from('produtos')
      .update({ estoque: novoEstoqueProduto })
      .eq('id', produto.id);

    if (!error) {
      alert(`Sucesso! ${quantidade}x ${produto.nome} adicionadas à vitrine. Os insumos foram descontados do estoque.`);
      setQtdProduzir({ ...qtdProduzir, [produto.id]: '' }); // Limpa o input
      fetchData(); // Atualiza tudo
    } else {
      alert("Erro ao atualizar a vitrine.");
    }
  };

  // Função para pequenos ajustes (ex: comeu uma trufa, ou ela estragou)
  const handleAjusteManual = async (id, estoqueAtual, ajuste) => {
    const novoEstoque = (estoqueAtual || 0) + ajuste;
    if (novoEstoque < 0) return; // Não deixa ficar negativo
    
    await supabase.from('produtos').update({ estoque: novoEstoque }).eq('id', id);
    fetchData();
  };

  if (loading) return <div className="p-4 text-center text-slate-500">Carregando vitrine...</div>;

  return (
    <div className="space-y-6 pb-20 text-graphite animate-in fade-in">
      
      <div className="bg-brand-pink text-white p-6 rounded-3xl shadow-sm flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-2xl">
          <Store size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Minha Vitrine</h2>
          <p className="text-xs text-pink-100 mt-1">Transforme ingredientes em produtos prontos.</p>
        </div>
      </div>

      <div className="space-y-4">
        {produtos.length === 0 ? (
          <div className="text-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-2">
            <AlertCircle className="text-slate-300" size={32} />
            <p className="text-slate-500 text-sm">Nenhum produto cadastrado.<br/>Vá em "Produção" para criar suas trufas!</p>
          </div>
        ) : (
          produtos.map((produto) => (
            <div key={produto.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
              
              {/* Cabeçalho do Card */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800">{produto.nome}</h3>
                  <p className="text-xs font-semibold text-brand-pink mt-1">Preço: R$ {produto.preco_venda.toFixed(2)}</p>
                </div>
                
                {/* Mostrador de Estoque Atual */}
                <div className="flex flex-col items-center bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Na Vitrine</span>
                  <div className="flex items-center gap-3 mt-1">
                    <button onClick={() => handleAjusteManual(produto.id, produto.estoque, -1)} className="text-slate-300 hover:text-red-400 active:scale-95"><Minus size={18} /></button>
                    <span className="text-lg font-black text-slate-700 w-6 text-center">{produto.estoque || 0}</span>
                    <button onClick={() => handleAjusteManual(produto.id, produto.estoque, 1)} className="text-slate-300 hover:text-green-500 active:scale-95"><Plus size={18} /></button>
                  </div>
                </div>
              </div>

              {/* Área de Produção em Lote */}
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <input 
                    type="number" 
                    placeholder="Qtd para produzir..." 
                  value={qtdProduzir[produto.id] || ''}
                  onChange={(e) => handleQtdChange(produto.id, e.target.value)}
                  className="flex-1 bg-white p-3 rounded-xl outline-none text-sm border border-slate-200 focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/20 transition-all"
                />
                <button 
                  onClick={() => handleProduzirLote(produto)}
                  className="bg-slate-900 text-white font-semibold px-4 py-3 rounded-xl flex items-center gap-2 active:scale-95 transition-transform text-sm"
                >
                  <PackagePlus size={18} /> Produzir
                </button>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}