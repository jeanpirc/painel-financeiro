'use client'
import { useEffect, useState } from 'react'
import { supabase, Lancamento } from '@/lib/supabase'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const MESES: Record<string, string> = {
  '01':'Janeiro','02':'Fevereiro','03':'Março','04':'Abril','05':'Maio','06':'Junho',
  '07':'Julho','08':'Agosto','09':'Setembro','10':'Outubro','11':'Novembro','12':'Dezembro'
}

export default function Dashboard() {
  const [mes, setMes] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  })
  const [lancs, setLancs] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('lancamentos').select('*').eq('mes', mes).order('data', { ascending: false })
      setLancs(data || [])
      setLoading(false)
    }
    load()
  }, [mes])

  const entradas = lancs.filter(l => l.tipo === 'entrada').reduce((s, l) => s + Number(l.valor), 0)
  const saidas = lancs.filter(l => l.tipo === 'saida').reduce((s, l) => s + Number(l.valor), 0)
  const resultado = entradas - saidas
  const margem = entradas > 0 ? (resultado / entradas) * 100 : 0
  const pct = entradas > 0 ? (saidas / entradas) * 100 : 0

  const [ano, m] = mes.split('-')
  const nomeMes = `${MESES[m]} ${ano}`

  // Últimos 8 lançamentos
  const ultimos = lancs.slice(0, 8)

  // Saídas por categoria
  const porCat: Record<string, number> = {}
  lancs.filter(l => l.tipo === 'saida').forEach(l => {
    porCat[l.categoria] = (porCat[l.categoria] || 0) + Number(l.valor)
  })

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Dashboard</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{nomeMes}</p>
        </div>
        <select value={mes} onChange={e => setMes(e.target.value)} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: '#fff' }}>
          {Array.from({length: 12}, (_, i) => {
            const d = new Date(); d.setMonth(d.getMonth() - i)
            const v = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
            return <option key={v} value={v}>{MESES[String(d.getMonth()+1).padStart(2,'0')]} {d.getFullYear()}</option>
          })}
        </select>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total de Entradas', val: fmt(entradas), cor: '#10b981', bg: '#f0fdf4', tv: '#065f46' },
          { label: 'Total de Saídas', val: fmt(saidas), cor: '#ef4444', bg: '#fef2f2', tv: '#991b1b' },
          { label: 'Resultado Líquido', val: fmt(resultado), cor: resultado >= 0 ? '#3b82f6' : '#ef4444', bg: resultado >= 0 ? '#eff6ff' : '#fef2f2', tv: resultado >= 0 ? '#1e40af' : '#991b1b' },
          { label: 'Margem de Resultado', val: margem.toFixed(1)+'%', cor: margem >= 20 ? '#10b981' : margem >= 0 ? '#f59e0b' : '#ef4444', bg: margem >= 20 ? '#f0fdf4' : margem >= 0 ? '#fffbeb' : '#fef2f2', tv: margem >= 20 ? '#065f46' : margem >= 0 ? '#92400e' : '#991b1b' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: 12, padding: 20, borderLeft: `4px solid ${k.cor}`, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.tv }}>{loading ? '...' : k.val}</div>
          </div>
        ))}
      </div>

      {/* Barra progresso */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
          <span>Saídas vs Entradas</span>
          <span>{pct.toFixed(1)}% das entradas comprometidas</span>
        </div>
        <div style={{ background: '#f3f4f6', borderRadius: 999, height: 12, overflow: 'hidden' }}>
          <div style={{ height: 12, borderRadius: 999, width: `${Math.min(pct,100)}%`, background: pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981', transition: 'width .5s' }} />
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Últimos lançamentos */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Últimos Lançamentos</h3>
          {loading ? <p style={{ color: '#9ca3af', fontSize: 13 }}>Carregando...</p> : ultimos.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 24 }}>Sem lançamentos neste mês</p>
          ) : ultimos.map(l => (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 15 }}>{l.tipo === 'entrada' ? '⬆' : '⬇'}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{l.descricao}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{l.data} <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '1px 6px', borderRadius: 4 }}>{l.categoria}</span></div>
                </div>
              </div>
              <span style={{ color: l.tipo === 'entrada' ? '#059669' : '#dc2626', fontWeight: 700, fontSize: 13 }}>
                {l.tipo === 'saida' ? '- ' : '+ '}{fmt(Number(l.valor))}
              </span>
            </div>
          ))}
        </div>

        {/* Saídas por categoria */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Saídas por Categoria</h3>
          {Object.entries(porCat).sort((a,b) => b[1]-a[1]).map(([cat, val]) => (
            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f9fafb', fontSize: 13 }}>
              <span style={{ color: '#4b5563' }}>{cat}</span>
              <span style={{ fontWeight: 600, color: '#dc2626' }}>{fmt(val)}</span>
            </div>
          ))}
          {Object.keys(porCat).length === 0 && <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 16 }}>Sem saídas neste mês</p>}
        </div>
      </div>
    </div>
  )
}
