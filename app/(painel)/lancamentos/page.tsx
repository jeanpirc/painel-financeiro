'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase, Lancamento, Categoria } from '@/lib/supabase'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function Lancamentos() {
  const [lancs, setLancs] = useState<Lancamento[]>([])
  const [cats, setCats] = useState<Categoria[]>([])
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState('')
  const [cat, setCat] = useState('')
  const [mes, setMes] = useState('')
  const [modal, setModal] = useState<'novo' | 'editar' | 'excluir' | null>(null)
  const [selecionado, setSelecionado] = useState<Lancamento | null>(null)
  const [form, setForm] = useState({ tipo: 'saida', desc: '', data: '', valor: '', cat: '', mes: '' })

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    const [{ data: l }, { data: c }] = await Promise.all([
      supabase.from('lancamentos').select('*').order('data', { ascending: false }),
      supabase.from('categorias').select('*').order('nome'),
    ])
    setLancs(l || [])
    setCats(c || [])
  }

  const filtrados = lancs.filter(l =>
    (!busca || l.descricao.toLowerCase().includes(busca.toLowerCase())) &&
    (!tipo || l.tipo === tipo) &&
    (!cat || l.categoria === cat) &&
    (!mes || l.mes === mes)
  )

  async function salvarNovo() {
    const { error } = await supabase.from('lancamentos').insert({
      tipo: form.tipo, descricao: form.desc, categoria: form.cat,
      data: form.data, mes: form.mes || form.data.slice(0,7), valor: parseFloat(form.valor)
    })
    if (!error) { setModal(null); carregarDados() }
  }

  async function salvarEdicao() {
    if (!selecionado) return
    const { error } = await supabase.from('lancamentos').update({
      tipo: form.tipo, descricao: form.desc, categoria: form.cat,
      data: form.data, valor: parseFloat(form.valor)
    }).eq('id', selecionado.id)
    if (!error) { setModal(null); carregarDados() }
  }

  async function confirmarExclusao() {
    if (!selecionado) return
    await supabase.from('lancamentos').delete().eq('id', selecionado.id)
    setModal(null); carregarDados()
  }

  function abrirEditar(l: Lancamento) {
    setSelecionado(l)
    setForm({ tipo: l.tipo, desc: l.descricao, data: l.data, valor: String(l.valor), cat: l.categoria, mes: l.mes })
    setModal('editar')
  }

  const mesesDisponiveis = [...new Set(lancs.map(l => l.mes))].sort().reverse()

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div><h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Lançamentos</h2><p style={{ fontSize: 13, color: '#6b7280' }}>Todos os registros financeiros</p></div>
        <button onClick={() => { setForm({ tipo: 'saida', desc: '', data: new Date().toISOString().slice(0,10), valor: '', cat: cats[0]?.nome||'', mes: '' }); setModal('novo') }}
          style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          + Novo Lançamento
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍 Buscar descrição..." style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, minWidth: 200 }} />
        <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
          <option value="">Todos os tipos</option>
          <option value="entrada">Entradas</option>
          <option value="saida">Saídas</option>
        </select>
        <select value={cat} onChange={e => setCat(e.target.value)} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
          <option value="">Todas as categorias</option>
          {cats.map(c => <option key={c.id}>{c.nome}</option>)}
        </select>
        <select value={mes} onChange={e => setMes(e.target.value)} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
          <option value="">Todos os meses</option>
          {mesesDisponiveis.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{['Data','Descrição','Categoria','Tipo','Valor','Ações'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Nenhum lançamento encontrado</td></tr>
              ) : filtrados.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '11px 12px', color: '#374151' }}>{l.data}</td>
                  <td style={{ padding: '11px 12px', color: '#374151', maxWidth: 260 }}>{l.descricao}</td>
                  <td style={{ padding: '11px 12px' }}><span style={{ background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>{l.categoria}</span></td>
                  <td style={{ padding: '11px 12px' }}><span style={{ background: l.tipo === 'entrada' ? '#d1fae5' : '#fee2e2', color: l.tipo === 'entrada' ? '#065f46' : '#991b1b', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500 }}>{l.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
                  <td style={{ padding: '11px 12px', fontWeight: 700, color: l.tipo === 'entrada' ? '#059669' : '#dc2626' }}>{l.tipo === 'saida' ? '- ' : '+ '}{fmt(Number(l.valor))}</td>
                  <td style={{ padding: '11px 12px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => abrirEditar(l)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => { setSelecionado(l); setModal('excluir') }} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div onClick={e => e.target === e.currentTarget && setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, margin: 16, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6' }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
                {modal === 'novo' ? 'Novo Lançamento' : modal === 'editar' ? 'Editar Lançamento' : 'Confirmar exclusão'}
              </h4>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {modal === 'excluir' ? (
                <p style={{ fontSize: 14, color: '#374151' }}>Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.</p>
              ) : (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Tipo</label>
                    <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
                      <option value="entrada">Entrada</option>
                      <option value="saida">Saída</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Descrição</label>
                    <input value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Data</label>
                      <input type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Valor (R$)</label>
                      <input type="number" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Categoria</label>
                    <select value={form.cat} onChange={e => setForm({...form, cat: e.target.value})} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
                      {cats.map(c => <option key={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #f3f4f6' }}>
              <button onClick={() => setModal(null)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              {modal === 'novo' && <button onClick={salvarNovo} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>Salvar</button>}
              {modal === 'editar' && <button onClick={salvarEdicao} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>Salvar</button>}
              {modal === 'excluir' && <button onClick={confirmarExclusao} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>Excluir</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
