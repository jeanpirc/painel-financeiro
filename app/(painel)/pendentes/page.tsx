'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase, Lancamento, Categoria } from '@/lib/supabase'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function Pendentes() {
  const [pendentes, setPendentes] = useState<Lancamento[]>([])
  const [cats, setCats] = useState<Categoria[]>([])
  const [modal, setModal] = useState<Lancamento | null>(null)
  const [catSel, setCatSel] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const [{ data: l }, { data: c }] = await Promise.all([
      supabase.from('lancamentos').select('*').eq('categoria', 'Sem categoria').order('data', { ascending: false }),
      supabase.from('categorias').select('*').order('nome'),
    ])
    setPendentes(l || [])
    setCats(c || [])
  }

  async function categorizar() {
    if (!modal || !catSel) return
    await supabase.from('lancamentos').update({ categoria: catSel }).eq('id', modal.id)
    setModal(null); carregar()
  }

  async function excluir(id: number) {
    await supabase.from('lancamentos').delete().eq('id', id)
    carregar()
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Pendentes</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Lançamentos sem categoria definida</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>{['Data','Descrição','Tipo','Valor','Banco','Ações'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {pendentes.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Nenhum lançamento pendente 🎉</td></tr>
            ) : pendentes.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                <td style={{ padding: '11px 12px', color: '#374151' }}>{l.data}</td>
                <td style={{ padding: '11px 12px', color: '#374151', maxWidth: 260 }}>{l.descricao}</td>
                <td style={{ padding: '11px 12px' }}><span style={{ background: l.tipo === 'entrada' ? '#d1fae5' : '#fee2e2', color: l.tipo === 'entrada' ? '#065f46' : '#991b1b', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>{l.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
                <td style={{ padding: '11px 12px', fontWeight: 700, color: l.tipo === 'entrada' ? '#059669' : '#dc2626' }}>{l.tipo === 'saida' ? '- ' : '+ '}{fmt(Number(l.valor))}</td>
                <td style={{ padding: '11px 12px', color: '#6b7280' }}>{(l as Lancamento & { banco?: string }).banco || '-'}</td>
                <td style={{ padding: '11px 12px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setModal(l); setCatSel(cats[0]?.nome || '') }} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Categorizar</button>
                    <button onClick={() => excluir(l.id)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div onClick={e => e.target === e.currentTarget && setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, margin: 16, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6' }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Categorizar</h4>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}><strong>{modal.descricao}</strong></p>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Categoria</label>
              <select value={catSel} onChange={e => setCatSel(e.target.value)} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
                {cats.map(c => <option key={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #f3f4f6' }}>
              <button onClick={() => setModal(null)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={categorizar} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
