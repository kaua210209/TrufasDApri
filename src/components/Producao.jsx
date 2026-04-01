import { useState, useEffect } from 'react';
import { Plus, Trash2, MinusCircle, PlusCircle, ChefHat, ShoppingBag, PackagePlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Producao() {
  const [subTab, setSubTab] = useState('brutos'); // 'brutos', 'panela', 'trufas'
  
  // ================= ESTADOS: INSUMOS =================
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [peso, setPeso] = useState('');

  // ================= ESTADOS: A PANELA =================
  const [nomeRecheio, setNomeRecheio] = useState('');
  const [pesoFinalRecheio, setPesoFinalRecheio] = useState('');
  const [ingredienteSelecionadoId, setIngredienteSelecionadoId] = useState('');
  const [quantidadeUsada, setQuantidadeUsada] = useState('');
  const [receitaAtual, setReceitaAtual] = useState([]); // Itens na panela

  // ================= ESTADOS: TRUFAS =================
  const [produtos, setProdutos] = useState([]);
  const [nomeTrufa, setNomeTrufa] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [ingredienteTrufaId, setIngredienteTrufaId] = useState('');
  const [qtdIngredienteTrufa, setQtdIngredienteTrufa] = useState('');
  const [receitaTrufa, setReceitaTrufa] = useState([]);

  // Buscar todos os produtos (trufas) cadastrados
  const fetchProdutos = async () => {
    const { data, error } = await supabase.from('produtos').select('*').order('nome');
    if (!error) setProdutos(data);
  };

  // Buscar todos os insumos (brutos e prontos)
  const fetchInsumos = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('insumos').select('*').order('nome');
    if (!error) setInsumos(data);
    setLoading(false);
  };

  useEffect(() => { 
    fetchInsumos(); 
    fetchProdutos(); 
  }, []);

  // Filtros
  const insumosBrutos = insumos.filter(i => !i.eh_receita_pronta);
  const recheiosProntos = insumos.filter(i => i.eh_receita_pronta);

  // ================= LÓGICAS: INSUMOS BRUTOS =================
  const handleAddInsumo = async (e) => {
    e.preventDefault();
    if (!nome || !preco || !peso) return alert("Preencha todos os campos!");
    const { error } = await supabase.from('insumos').insert([{ nome, preco_pago: parseFloat(preco), peso_total_gramas: parseFloat(peso) }]);
    if (!error) { setNome(''); setPreco(''); setPeso(''); fetchInsumos(); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir?")) {
      await supabase.from('insumos').delete().eq('id', id);
      fetchInsumos();
    }
  };

  const handleAjusteEstoque = async (id, pesoAtual, ajuste) => {
    const novoPeso = pesoAtual + ajuste;
    if (novoPeso < 0) return alert("O peso não pode ser negativo!");
    await supabase.from('insumos').update({ peso_total_gramas: novoPeso }).eq('id', id);
    fetchInsumos();
  };

  // ================= LÓGICAS: A PANELA =================
  const addIngredienteNaPanela = () => {
    if (!ingredienteSelecionadoId || !quantidadeUsada) return alert("Selecione o ingrediente e a quantidade!");
    
    const insumoDB = insumos.find(i => i.id === ingredienteSelecionadoId);
    if (parseFloat(quantidadeUsada) > insumoDB.peso_total_gramas) {
      return alert("Você não tem essa quantidade no estoque bruto!");
    }

    const custoDessaQuantidade = (insumoDB.preco_pago / insumoDB.peso_total_gramas) * parseFloat(quantidadeUsada);

    setReceitaAtual([...receitaAtual, {
      id: insumoDB.id,
      nome: insumoDB.nome,
      quantidade: parseFloat(quantidadeUsada),
      custoCalculado: custoDessaQuantidade
    }]);

    setIngredienteSelecionadoId('');
    setQuantidadeUsada('');
  };

  const removerDaPanela = (index) => {
    const novaReceita = [...receitaAtual];
    novaReceita.splice(index, 1);
    setReceitaAtual(novaReceita);
  };

  const custoTotalDaPanela = receitaAtual.reduce((acc, item) => acc + item.custoCalculado, 0);

  const handleFinalizarRecheio = async () => {
    if (!nomeRecheio || !pesoFinalRecheio || receitaAtual.length === 0) {
      return alert("Preencha o nome, o peso final após o preparo e adicione ingredientes!");
    }

    // 1. Criar o novo Recheio no banco (eh_receita_pronta = true)
    const { error: erroInsert } = await supabase.from('insumos').insert([{
      nome: nomeRecheio,
      preco_pago: custoTotalDaPanela,
      peso_total_gramas: parseFloat(pesoFinalRecheio),
      eh_receita_pronta: true
    }]);

    if (erroInsert) return alert("Erro ao salvar o recheio.");

    // 2. Subtrair os ingredientes brutos usados do estoque
    for (const item of receitaAtual) {
      const insumoOriginal = insumos.find(i => i.id === item.id);
      await supabase.from('insumos')
        .update({ peso_total_gramas: insumoOriginal.peso_total_gramas - item.quantidade })
        .eq('id', item.id);
    }

    alert("Recheio criado com sucesso! Estoque bruto atualizado.");
    setNomeRecheio(''); setPesoFinalRecheio(''); setReceitaAtual([]); fetchInsumos();
  };

  // ================= LÓGICAS: TRUFAS =================
  const addIngredienteTrufa = () => {
    if (!ingredienteTrufaId || !qtdIngredienteTrufa) return alert("Selecione o ingrediente e a quantidade!");
    
    const insumoDB = insumos.find(i => i.id === ingredienteTrufaId);
    // Custo proporcional do ingrediente usado na trufa
    const custoDessaQuantidade = (insumoDB.preco_pago / insumoDB.peso_total_gramas) * parseFloat(qtdIngredienteTrufa);

    setReceitaTrufa([...receitaTrufa, {
      insumoId: insumoDB.id,
      nome: insumoDB.nome,
      qtd: parseFloat(qtdIngredienteTrufa),
      custoCalculado: custoDessaQuantidade
    }]);

    setIngredienteTrufaId('');
    setQtdIngredienteTrufa('');
  };

  const removerIngredienteTrufa = (index) => {
    const novaReceita = [...receitaTrufa];
    novaReceita.splice(index, 1);
    setReceitaTrufa(novaReceita);
  };

  // Custo em tempo real da Trufa
  const custoEstimadoTrufa = receitaTrufa.reduce((acc, item) => acc + item.custoCalculado, 0);

  const handleSalvarTrufa = async () => {
    if (!nomeTrufa || !precoVenda || receitaTrufa.length === 0) {
      return alert("Preencha o nome, o preço de venda e adicione a receita!");
    }

    // Formata o JSON exatamente como exigido no schema do banco
    const receitaJson = receitaTrufa.map(item => ({ insumoId: item.insumoId, qtd: item.qtd }));

    const { error } = await supabase.from('produtos').insert([{
      nome: nomeTrufa,
      preco_venda: parseFloat(precoVenda),
      custo_estimado: custoEstimadoTrufa,
      receita_json: receitaJson
    }]);

    if (!error) {
      alert("Trufa cadastrada com sucesso!");
      setNomeTrufa(''); setPrecoVenda(''); setReceitaTrufa([]); fetchProdutos();
    } else {
      alert("Erro ao cadastrar trufa.");
    }
  };

  const handleDeleteTrufa = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta trufa?")) {
      await supabase.from('produtos').delete().eq('id', id);
      fetchProdutos();
    }
  };

  return (
    <div className="space-y-6 pb-20 text-graphite">
      
      {/* NAVEGAÇÃO INTERNA (SUB-ABAS) */}
      <div className="flex bg-slate-100 p-1 rounded-2xl">
        <button onClick={() => setSubTab('brutos')} className={`flex-1 flex justify-center items-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${subTab === 'brutos' ? 'bg-white shadow-sm text-brand-pink' : 'text-slate-400'}`}>
          <ShoppingBag size={16} /> Insumos
        </button>
        <button onClick={() => setSubTab('panela')} className={`flex-1 flex justify-center items-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${subTab === 'panela' ? 'bg-white shadow-sm text-brand-pink' : 'text-slate-400'}`}>
          <ChefHat size={16} /> A Panela
        </button>
        <button onClick={() => setSubTab('trufas')} className={`flex-1 flex justify-center items-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${subTab === 'trufas' ? 'bg-white shadow-sm text-brand-pink' : 'text-slate-400'}`}>
          <PackagePlus size={16} /> Trufas
        </button>
      </div>

      {/* ================= TELA 1: INSUMOS BRUTOS ================= */}
      {subTab === 'brutos' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
          <form onSubmit={handleAddInsumo} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 ml-2">Nome do Ingrediente</label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Barra Chocolate Ao Leite" className="w-full bg-slate-50 p-3 rounded-2xl outline-none focus:ring-2 focus:ring-brand-pink/50 transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 ml-2">Preço Pago (R$)</label>
                <input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} className="w-full bg-slate-50 p-3 rounded-2xl outline-none focus:ring-2 focus:ring-brand-pink/50 transition-all" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 ml-2">Peso Total (g)</label>
                <input type="number" value={peso} onChange={(e) => setPeso(e.target.value)} className="w-full bg-slate-50 p-3 rounded-2xl outline-none focus:ring-2 focus:ring-brand-pink/50 transition-all" />
              </div>
            </div>
            <button type="submit" className="w-full bg-brand-pink text-white font-semibold py-3 rounded-2xl active:scale-95 transition-transform flex justify-center items-center gap-2">
              <Plus size={20} /> Cadastrar Insumo
            </button>
          </form>

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-700">Estoque Bruto</h3>
            {insumosBrutos.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm">{item.nome}</h4>
                  <p className="text-[10px] font-semibold text-brand-pink mt-1">Custo: R$ {item.custo_por_grama?.toFixed(4)}/g</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleAjusteEstoque(item.id, item.peso_total_gramas, -50)} className="text-slate-400"><MinusCircle size={22} /></button>
                  <span className="text-xs font-bold w-8 text-center">{item.peso_total_gramas}g</span>
                  <button onClick={() => handleAjusteEstoque(item.id, item.peso_total_gramas, 50)} className="text-brand-pink"><PlusCircle size={22} /></button>
                  <button onClick={() => handleDelete(item.id)} className="ml-2 text-slate-300 hover:text-red-500"><Trash2 size={20} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TELA 2: A PANELA ================= */}
      {subTab === 'panela' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-bold text-lg text-slate-700">Misturar Ingredientes</h3>
            <div className="flex gap-2">
              <select value={ingredienteSelecionadoId} onChange={(e) => setIngredienteSelecionadoId(e.target.value)} className="flex-1 bg-slate-50 p-3 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-brand-pink/50">
                <option value="">Selecione o insumo...</option>
                {insumosBrutos.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
              </select>
              <input type="number" placeholder="Qtd (g)" value={quantidadeUsada} onChange={(e) => setQuantidadeUsada(e.target.value)} className="w-24 bg-slate-50 p-3 rounded-2xl outline-none text-sm text-center focus:ring-2 focus:ring-brand-pink/50" />
              <button onClick={addIngredienteNaPanela} className="bg-slate-900 text-white p-3 rounded-2xl active:scale-95"><Plus size={20} /></button>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 min-h-[100px]">
              {receitaAtual.length === 0 ? (
                <p className="text-center text-xs text-slate-400 mt-6">Sua panela está vazia.</p>
              ) : (
                receitaAtual.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-slate-200 last:border-0">
                    <span>{item.quantidade}g de {item.nome}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-500">R$ {item.custoCalculado.toFixed(2)}</span>
                      <button onClick={() => removerDaPanela(idx)} className="text-red-400"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 ml-2">Nome do Recheio Pronto</label>
                <input type="text" value={nomeRecheio} onChange={(e) => setNomeRecheio(e.target.value)} placeholder="Ex: Brigadeiro Gourmet" className="w-full bg-slate-50 p-3 rounded-2xl outline-none focus:ring-2 focus:ring-brand-pink/50" />
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500 ml-2">Peso Final (Pós-fogo) em gramas</label>
                  <input type="number" value={pesoFinalRecheio} onChange={(e) => setPesoFinalRecheio(e.target.value)} placeholder="Ex: 450" className="w-full bg-slate-50 p-3 rounded-2xl outline-none focus:ring-2 focus:ring-brand-pink/50" />
                </div>
                <div className="flex-1 bg-slate-900 text-white p-3 rounded-2xl flex flex-col justify-center items-center">
                  <span className="text-[10px] text-slate-400">Custo Total</span>
                  <span className="font-bold">R$ {custoTotalDaPanela.toFixed(2)}</span>
                </div>
              </div>
              <button onClick={handleFinalizarRecheio} className="w-full bg-brand-pink text-white font-bold py-3 rounded-2xl active:scale-95 transition-transform flex justify-center gap-2">
                <ChefHat size={20} /> Cozinhar e Guardar Recheio
              </button>
            </div>
          </div>
          <div className="space-y-3 pt-4">
            <h3 className="text-lg font-bold text-slate-700">Recheios na Geladeira</h3>
            {recheiosProntos.length === 0 && <p className="text-sm text-slate-400">Nenhum recheio pronto.</p>}
            {recheiosProntos.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm">{item.nome}</h4>
                  <p className="text-xs text-slate-500">R$ {item.preco_pago} • {item.peso_total_gramas}g</p>
                  <p className="text-[10px] font-semibold text-brand-pink mt-1">Custo: R$ {item.custo_por_grama?.toFixed(4)}/g</p>
                </div>
                <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={20} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TELA 3: MONTAGEM DE TRUFAS ================= */}
      {subTab === 'trufas' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-bold text-lg text-slate-700">Ficha Técnica da Trufa</h3>
            <div className="flex gap-2">
              <select value={ingredienteTrufaId} onChange={(e) => setIngredienteTrufaId(e.target.value)} className="flex-1 bg-slate-50 p-3 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-brand-pink/50">
                <option value="">Ingrediente ou Recheio...</option>
                {insumos.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.nome} ({i.eh_receita_pronta ? 'Recheio' : 'Bruto'})
                  </option>
                ))}
              </select>
              <input type="number" placeholder="Qtd (g)" value={qtdIngredienteTrufa} onChange={(e) => setQtdIngredienteTrufa(e.target.value)} className="w-24 bg-slate-50 p-3 rounded-2xl outline-none text-sm text-center focus:ring-2 focus:ring-brand-pink/50" />
              <button onClick={addIngredienteTrufa} className="bg-slate-900 text-white p-3 rounded-2xl active:scale-95"><Plus size={20} /></button>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 min-h-[100px]">
              {receitaTrufa.length === 0 ? (
                <p className="text-center text-xs text-slate-400 mt-6">A receita está vazia.</p>
              ) : (
                receitaTrufa.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-slate-200 last:border-0">
                    <span>{item.qtd}g de {item.nome}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-500">R$ {item.custoCalculado.toFixed(2)}</span>
                      <button onClick={() => removerIngredienteTrufa(idx)} className="text-red-400"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 ml-2">Nome da Trufa</label>
                <input type="text" value={nomeTrufa} onChange={(e) => setNomeTrufa(e.target.value)} placeholder="Ex: Trufa de Maracujá com Chocolate" className="w-full bg-slate-50 p-3 rounded-2xl outline-none focus:ring-2 focus:ring-brand-pink/50" />
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="text-xs font-semibold text-slate-500 ml-2">Preço de Venda (R$)</label>
                  <input type="number" step="0.01" value={precoVenda} onChange={(e) => setPrecoVenda(e.target.value)} placeholder="Ex: 5.00" className="w-full bg-slate-50 p-3 rounded-2xl outline-none focus:ring-2 focus:ring-brand-pink/50 text-brand-pink font-bold" />
                </div>
                <div className="bg-slate-900 text-white p-3 rounded-2xl flex flex-col justify-center items-center">
                  <span className="text-[10px] text-slate-400">Custo de Produção</span>
                  <span className="font-bold text-red-400">R$ {custoEstimadoTrufa.toFixed(2)}</span>
                </div>
              </div>
              {precoVenda && (
                <div className="text-center text-xs font-bold text-green-500 bg-green-50 p-2 rounded-xl">
                  Lucro por unidade: R$ {(parseFloat(precoVenda) - custoEstimadoTrufa).toFixed(2)}
                </div>
              )}
              <button onClick={handleSalvarTrufa} className="w-full bg-brand-pink text-white font-bold py-3 rounded-2xl active:scale-95 transition-transform flex justify-center gap-2">
                <PackagePlus size={20} /> Salvar Produto Final
              </button>
            </div>
          </div>
          <div className="space-y-3 pt-4">
            <h3 className="text-lg font-bold text-slate-700">Meu Catálogo</h3>
            {produtos.length === 0 && <p className="text-sm text-slate-400">Nenhum produto cadastrado.</p>}
            {produtos.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm">{item.nome}</h4>
                  <div className="flex gap-2 text-[10px] mt-1">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">Custo: R$ {item.custo_estimado.toFixed(2)}</span>
                    <span className="bg-brand-pink/10 text-brand-pink px-2 py-1 rounded-lg font-bold">Venda: R$ {item.preco_venda.toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={() => handleDeleteTrufa(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={20} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}