import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient<any, 'public', any> | null = null

function getClient(): SupabaseClient<any, 'public', any> {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error('Supabase URL or anon key not configured')
    }

    client = createSupabaseClient(url, key)
  }
  return client
}

export const supabase = {
  get auth() {
    return getClient().auth
  },
  from(table: string) {
    return getClient().from(table)
  }
} as unknown as SupabaseClient<any, 'public', any>

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
