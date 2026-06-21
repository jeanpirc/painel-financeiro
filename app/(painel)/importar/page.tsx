'use client'
import { useState, useEffect } from 'react'
import { supabase, Categoria } from '@/lib/supabase'
import { parsearExtrato, categorizarAuto, mesDeData, TransacaoBruta } from '@/lib/parsers'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

type ItemPrevia = TransacaoBruta & { cat: string }

export default function Importar() {
  const [cats, setCats] = useState<Categoria[]>([])
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [previa, setPrevia] = useState<ItemPrevia[]>([])
  const [etapa, setEtapa] = useState<'upload' | 'previa' | 'concluido'>('upload')
  const [salvos, setSalvos] = useState(0)
  const [historico, setHistorico] = useState<{ data: string; arquivo: string; banco: string; registros: number }[]>([])

  useEffect(() => {
    supabase.from('categorias').select('*').order('nome').then(({ data }) => setCats(data || []))
  }, [])

  async function processar() {
    if (!arquivo) return
    const texto = await arquivo.text()
    const transacoes = parsearExtrato(arquivo.name, texto)

    // busca ids existentes
    const { data: existentes } = await supabase.from('lancamentos').select('identificador').not('identificador', 'is', null)
    const idsExistentes = new Set((existentes || []).map((x: { identificador: string }) => x.identificador))

    const itens: ItemPrevia[] = transacoes
      .filter(t => !t.identificador || !idsExistentes.has(t.identificador))
      .map(t => ({ ...t, cat: categorizarAuto(t.descricao, t.tipo) }))

    if (itens.length === 0) {
      alert('Nenhuma transação nova encontrada — todas já foram importadas.')
      return
    }

    setPrevia(itens)
    setEtapa('previa')
  }

  async function confirmar() {
    let count = 0
    for (const l of previa) {
      const dataFormatada = l.data.includes('/') ? l.data.split('/').reverse().join('-') : l.data
      const { error } = await supabase.from('lancamentos').insert({
        tipo: l.tipo, descricao: l.descricao, categoria: l.cat,
        data: dataFormatada, mes: mesDeData(l.data), valor: l.valor,
        identificador: l.identificador || null, banco: l.banco
      })
      if (!error) count++
    }
    setSalvos(count)
    setHistorico(h => [{ data: new Date().toLocaleDateString('pt-BR'), arquivo: arquivo!.name, banco: previa[0]?.banco || '-', registros: count }, ...h])
    setEtapa('concluido')
  }

  function reiniciar() {
    setArquivo(null); setPrevia([]); setEtapa('upload')
  }

  function atualizarCat(i: number, cat: string) {
    setPrevia(p => p.map((x, idx) => idx === i ? { ...x, cat } : x))
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Importar</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Importar extratos bancários — Nubank, Itaú, Mercado Pago, Bradesco</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: etapa === 'previa' ? '1fr' : '1fr 1fr', gap: 16 }}>

        {/* Upload / Prévia / Concluído */}
        {etapa === 'upload' && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Selecione o arquivo</h3>
            <input type="file" id="fi" accept=".csv,.ofx,.xlsx" style={{ display: 'none' }} onChange={e => setArquivo(e.target.files?.[0] || null)} />
            <div onClick={() => document.getElementById('fi')?.click()} style={{ border: '2px dashed #e5e7eb', borderRadius: 12, padding: 40, textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{arquivo ? `📄 ${arquivo.name}` : 'Clique para selecionar ou arraste aqui'}</h4>
              <p style={{ fontSize: 12, color: '#9ca3af' }}>Nubank (.csv), Itaú (.csv), Mercado Pago (.csv), Bradesco (.csv)</p>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button onClick={processar} disabled={!arquivo} style={{ flex: 1, background: arquivo ? '#4f46e5' : '#e5e7eb', color: arquivo ? '#fff' : '#9ca3af', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 500, cursor: arquivo ? 'pointer' : 'default' }}>
                Processar arquivo
              </button>
            </div>
          </div>
        )}

        {etapa === 'previa' && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Prévia — {previa.length} transações de {previa[0]?.banco}</h3>
              <button onClick={reiniciar} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>← Voltar</button>
            </div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>{['Data','Descrição','Tipo','Valor','Categoria'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6', position: 'sticky', top: 0, background: '#fff' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {previa.map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{l.data}</td>
                      <td style={{ padding: '8px 10px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.descricao}>{l.descricao}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ background: l.tipo === 'entrada' ? '#d1fae5' : '#fee2e2', color: l.tipo === 'entrada' ? '#065f46' : '#991b1b', padding: '2px 6px', borderRadius: 999, fontSize: 11 }}>{l.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span>
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: l.tipo === 'entrada' ? '#059669' : '#dc2626', whiteSpace: 'nowrap' }}>{l.tipo === 'saida' ? '- ' : '+ '}{fmt(l.valor)}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <select value={l.cat} onChange={e => atualizarCat(i, e.target.value)} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 6px', fontSize: 11 }}>
                          {cats.map(c => <option key={c.id}>{c.nome}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={reiniciar} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmar} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>Salvar {previa.length} lançamentos</button>
            </div>
          </div>
        )}

        {etapa === 'concluido' && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 40, boxShadow: '0 1px 3px rgba(0,0,0,.06)', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{salvos} lançamentos importados!</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Os dados já estão disponíveis em Lançamentos e no Dashboard.</p>
            <button onClick={reiniciar} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, cursor: 'pointer' }}>Importar outro arquivo</button>
          </div>
        )}

        {/* Histórico */}
        {etapa !== 'previa' && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Histórico de importações</h3>
            {historico.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 24 }}>Nenhuma importação nesta sessão</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr>{['Data','Arquivo','Banco','Registros'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>{h}</th>
                ))}</tr></thead>
                <tbody>{historico.map((h, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '10px 10px', color: '#374151' }}>{h.data}</td>
                    <td style={{ padding: '10px 10px', color: '#374151' }}>{h.arquivo}</td>
                    <td style={{ padding: '10px 10px', color: '#374151' }}>{h.banco}</td>
                    <td style={{ padding: '10px 10px' }}><span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>✓ {h.registros}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
