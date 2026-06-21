'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const MESES: Record<string, string> = {
  '01':'Janeiro','02':'Fevereiro','03':'Março','04':'Abril','05':'Maio','06':'Junho',
  '07':'Julho','08':'Agosto','09':'Setembro','10':'Outubro','11':'Novembro','12':'Dezembro'
}

type ResumoMes = { mes: string; nome: string; entradas: number; saidas: number; resultado: number; margem: number; qtd: number }

export default function Fechamentos() {
  const [resumos, setResumos] = useState<ResumoMes[]>([])
  const [loading, setLoading] = useState(true)
  const [detalhe, setDetalhe] = useState<ResumoMes | null>(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data } = await supabase.from('lancamentos').select('mes, tipo, valor')
    if (!data) { setLoading(false); return }

    const porMes: Record<string, { e: number; s: number; qtd: number }> = {}
    data.forEach((l: { mes: string; tipo: string; valor: number }) => {
      if (!porMes[l.mes]) porMes[l.mes] = { e: 0, s: 0, qtd: 0 }
      if (l.tipo === 'entrada') porMes[l.mes].e += Number(l.valor)
      else porMes[l.mes].s += Number(l.valor)
      porMes[l.mes].qtd++
    })

    const lista: ResumoMes[] = Object.entries(porMes).map(([mes, v]) => {
      const [ano, m] = mes.split('-')
      const resultado = v.e - v.s
      return { mes, nome: `${MESES[m]} ${ano}`, entradas: v.e, saidas: v.s, resultado, margem: v.e > 0 ? (resultado / v.e) * 100 : 0, qtd: v.qtd }
    }).sort((a, b) => b.mes.localeCompare(a.mes))

    setResumos(lista)
    setLoading(false)
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Fechamentos</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Resumo mensal de caixa</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>{['Mês','Entradas','Saídas','Resultado','Margem','Lançamentos',''].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Carregando...</td></tr>
            ) : resumos.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Nenhum lançamento encontrado</td></tr>
            ) : resumos.map(r => (
              <tr key={r.mes} style={{ borderBottom: '1px solid #f9fafb' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#111827' }}>{r.nome}</td>
                <td style={{ padding: '12px 16px', color: '#059669', fontWeight: 700 }}>{fmt(r.entradas)}</td>
                <td style={{ padding: '12px 16px', color: '#dc2626', fontWeight: 700 }}>{fmt(r.saidas)}</td>
                <td style={{ padding: '12px 16px', color: r.resultado >= 0 ? '#1e40af' : '#dc2626', fontWeight: 700 }}>{fmt(r.resultado)}</td>
                <td style={{ padding: '12px 16px', color: '#374151' }}>{r.margem.toFixed(1)}%</td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{r.qtd}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => setDetalhe(r)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Ver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal detalhe */}
      {detalhe && (
        <div onClick={e => e.target === e.currentTarget && setDetalhe(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, margin: 16, boxShadow: '0 20px 60px rgba(0,0,0,.2)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6' }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Fechamento — {detalhe.nome}</h4>
              <button onClick={() => setDetalhe(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'ENTRADAS', val: fmt(detalhe.entradas), bg: '#f0fdf4', cor: '#10b981', tv: '#065f46' },
                { label: 'SAÍDAS', val: fmt(detalhe.saidas), bg: '#fef2f2', cor: '#ef4444', tv: '#991b1b' },
                { label: 'RESULTADO', val: fmt(detalhe.resultado), bg: '#eff6ff', cor: '#3b82f6', tv: '#1e40af' },
                { label: 'MARGEM', val: detalhe.margem.toFixed(1)+'%', bg: '#f0fdf4', cor: '#10b981', tv: '#065f46' },
              ].map(k => (
                <div key={k.label} style={{ background: k.bg, borderRadius: 10, padding: 14, borderLeft: `3px solid ${k.cor}` }}>
                  <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{k.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: k.tv, marginTop: 4 }}>{k.val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid #f3f4f6' }}>
              <button onClick={() => setDetalhe(null)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
