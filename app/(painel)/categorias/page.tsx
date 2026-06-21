'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase, Categoria } from '@/lib/supabase'

const CORES = ['#10b981','#6366f1','#ef4444','#f59e0b','#3b82f6','#8b5cf6','#f97316','#94a3b8','#dc2626','#059669']

export default function Categorias() {
  const [cats, setCats] = useState<Categoria[]>([])
  const [modal, setModal] = useState<'nova' | 'editar' | null>(null)
  const [form, setForm] = useState({ nome: '', tipo: 'saida', cor: '#6366f1' })
  const [editId, setEditId] = useState<number | null>(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data } = await supabase.from('categorias').select('*').order('tipo').order('nome')
    setCats(data || [])
  }

  async function salvar() {
    if (!form.nome.trim()) return
    if (editId) {
      await supabase.from('categorias').update({ nome: form.nome, tipo: form.tipo, cor: form.cor }).eq('id', editId)
    } else {
      await supabase.from('categorias').insert({ nome: form.nome, tipo: form.tipo, cor: form.cor })
    }
    setModal(null); carregar()
  }

  async function excluir(id: number) {
    if (!confirm('Excluir esta categoria?')) return
    await supabase.from('categorias').delete().eq('id', id)
    carregar()
  }

  function abrirEditar(c: Categoria) {
    setEditId(c.id); setForm({ nome: c.nome, tipo: c.tipo, cor: c.cor }); setModal('editar')
  }

  const entradas = cats.filter(c => c.tipo === 'entrada')
  const saidas = cats.filter(c => c.tipo === 'saida')

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div><h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Categorias</h2><p style={{ fontSize: 13, color: '#6b7280' }}>Gerencie as categorias de lançamentos</p></div>
        <button onClick={() => { setEditId(null); setForm({ nome: '', tipo: 'saida', cor: '#6366f1' }); setModal('nova') }}
          style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          + Nova Categoria
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[{ label: 'Entradas', items: entradas }, { label: 'Saídas', items: saidas }].map(g => (
          <div key={g.label} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Categorias de {g.label}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr>{['Cor','Nome',''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {g.items.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '10px 10px' }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: c.cor, display: 'inline-block' }} /></td>
                    <td style={{ padding: '10px 10px', color: '#374151' }}>{c.nome}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => abrirEditar(c)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Editar</button>
                        <button onClick={() => excluir(c.id)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {modal && (
        <div onClick={e => e.target === e.currentTarget && setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, margin: 16, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6' }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{modal === 'nova' ? 'Nova Categoria' : 'Editar Categoria'}</h4>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Nome</label>
                <input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Tipo</label>
                  <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Cor</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {CORES.map(c => (
                      <button key={c} onClick={() => setForm({...form, cor: c})} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: form.cor === c ? '3px solid #111827' : '2px solid transparent', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #f3f4f6' }}>
              <button onClick={() => setModal(null)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={salvar} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
