import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string) {
    return (getClient() as never)[prop]
  }
})

export type Lancamento = {
  id: number
  tipo: 'entrada' | 'saida'
  descricao: string
  categoria: string
  data: string
  mes: string
  valor: number
  identificador?: string
  banco?: string
  created_at: string
}

export type Categoria = {
  id: number
  nome: string
  tipo: 'entrada' | 'saida'
  cor: string
}

export type Fechamento = {
  id: number
  mes: string
  nome_mes: string
  total_entradas: number
  total_saidas: number
  resultado: number
  margem: number
  status: 'aguardando' | 'em_aberto' | 'fechado'
  observacoes?: string
}
