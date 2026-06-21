export type TransacaoBruta = {
  data: string
  valor: number
  tipo: 'entrada' | 'saida'
  descricao: string
  identificador?: string
  banco: string
}

const REGRAS_CAT: { tipo: 'entrada' | 'saida'; regex: RegExp; cat: string }[] = [
  { tipo: 'entrada', regex: /mensalidade/i, cat: 'Mensalidade' },
  { tipo: 'entrada', regex: /personal|treino|academia/i, cat: 'Personal' },
  { tipo: 'saida', regex: /mensalidade/i, cat: 'Mensalidade' },
  { tipo: 'saida', regex: /personal|treino|academia/i, cat: 'Personal' },
  { tipo: 'saida', regex: /aluguel/i, cat: 'Aluguel' },
  { tipo: 'saida', regex: /ipva/i, cat: 'IPVA' },
  { tipo: 'saida', regex: /combust[ií]vel|gasolina|posto|etanol/i, cat: 'Combustível' },
  { tipo: 'saida', regex: /luz|energia|sabesp|copasa|cemig|enel|cpfl|agua|internet|claro|vivo|tim|oi |net |gás/i, cat: 'Luz / Água / Internet' },
  { tipo: 'saida', regex: /prefeitura|imposto|das|receita federal|tribut/i, cat: 'IPVA' },
  { tipo: 'saida', regex: /aplica..o rdb|rdb|cdb|fundo|investimento/i, cat: 'Investimentos' },
  { tipo: 'saida', regex: /boleto|fatura|financiamento|portoseg/i, cat: 'Pagamento de Fatura' },
]

export function categorizarAuto(desc: string, tipo: 'entrada' | 'saida'): string {
  for (const r of REGRAS_CAT) {
    if (r.tipo === tipo && r.regex.test(desc)) return r.cat
  }
  return 'Custos'
}

export function mesDeData(data: string): string {
  // data = DD/MM/YYYY ou YYYY-MM-DD
  if (data.includes('-') && data.indexOf('-') === 4) {
    return data.slice(0, 7)
  }
  const [, m, y] = data.split('/')
  return `${y}-${m}`
}

// ── NUBANK ──────────────────────────────────────
export function parseNubank(csv: string): TransacaoBruta[] {
  const linhas = csv.trim().split('\n').slice(1)
  const result: TransacaoBruta[] = []
  for (const linha of linhas) {
    if (!linha.trim()) continue
    const cols = linha.split(',')
    if (cols.length < 4) continue
    const data = cols[0].trim()
    const valor = parseFloat(cols[1].trim())
    const identificador = cols[2].trim()
    const descricao = cols.slice(3).join(',').trim().replace(/^"|"$/g, '')
    if (isNaN(valor) || valor === 0) continue
    const tipo = valor > 0 ? 'entrada' : 'saida'
    result.push({ data, valor: Math.abs(valor), tipo, descricao, identificador, banco: 'Nubank' })
  }
  return result
}

// ── ITAÚ ────────────────────────────────────────
// Formato: Data;Histórico;Docto.;Crédito;Débito;Saldo
export function parseItau(csv: string): TransacaoBruta[] {
  const linhas = csv.trim().split('\n')
  const result: TransacaoBruta[] = []
  for (const linha of linhas) {
    const cols = linha.split(';').map(c => c.trim().replace(/"/g, ''))
    if (cols.length < 5) continue
    const data = cols[0]
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) continue
    const descricao = cols[1]
    const credito = parseFloat(cols[3].replace('.', '').replace(',', '.')) || 0
    const debito = parseFloat(cols[4].replace('.', '').replace(',', '.')) || 0
    if (credito > 0) result.push({ data, valor: credito, tipo: 'entrada', descricao, banco: 'Itaú' })
    if (debito > 0) result.push({ data, valor: debito, tipo: 'saida', descricao, banco: 'Itaú' })
  }
  return result
}

// ── MERCADO PAGO ────────────────────────────────
// Formato: date,description,amount,type
export function parseMercadoPago(csv: string): TransacaoBruta[] {
  const linhas = csv.trim().split('\n').slice(1)
  const result: TransacaoBruta[] = []
  for (const linha of linhas) {
    if (!linha.trim()) continue
    const cols = linha.split(',')
    if (cols.length < 3) continue
    const data = cols[0].trim()
    const descricao = cols[1].trim().replace(/^"|"$/g, '')
    const valor = parseFloat(cols[2].trim().replace(',', '.'))
    if (isNaN(valor) || valor === 0) continue
    const tipo = valor > 0 ? 'entrada' : 'saida'
    result.push({ data, valor: Math.abs(valor), tipo, descricao, banco: 'Mercado Pago' })
  }
  return result
}

// ── BRADESCO ────────────────────────────────────
// Formato: Data;Histórico;Valor
export function parseBradesco(csv: string): TransacaoBruta[] {
  const linhas = csv.trim().split('\n')
  const result: TransacaoBruta[] = []
  for (const linha of linhas) {
    const cols = linha.split(';').map(c => c.trim().replace(/"/g, ''))
    if (cols.length < 3) continue
    const data = cols[0]
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) continue
    const descricao = cols[1]
    const valor = parseFloat(cols[2].replace('.', '').replace(',', '.'))
    if (isNaN(valor) || valor === 0) continue
    const tipo = valor > 0 ? 'entrada' : 'saida'
    result.push({ data, valor: Math.abs(valor), tipo, descricao, banco: 'Bradesco' })
  }
  return result
}

export function detectarBanco(nomeArquivo: string, conteudo: string): string {
  const nome = nomeArquivo.toLowerCase()
  if (nome.includes('nu_') || nome.includes('nubank')) return 'nubank'
  if (nome.includes('itau') || nome.includes('itaú')) return 'itau'
  if (nome.includes('mercado') || nome.includes('mp_')) return 'mercadopago'
  if (nome.includes('bradesco')) return 'bradesco'
  // tenta detectar pelo conteúdo
  if (conteudo.includes('Data,Valor,Identificador')) return 'nubank'
  if (conteudo.includes('Histórico') && conteudo.includes('Crédito')) return 'itau'
  return 'nubank'
}

export function parsearExtrato(nomeArquivo: string, conteudo: string): TransacaoBruta[] {
  const banco = detectarBanco(nomeArquivo, conteudo)
  switch (banco) {
    case 'itau': return parseItau(conteudo)
    case 'mercadopago': return parseMercadoPago(conteudo)
    case 'bradesco': return parseBradesco(conteudo)
    default: return parseNubank(conteudo)
  }
}
