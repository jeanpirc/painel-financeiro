import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
