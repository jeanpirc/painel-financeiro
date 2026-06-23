import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wxzkqxbmstbzmxynnvhv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4emtxeGJtc3Riem14eW5udmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDE0NjYsImV4cCI6MjA5NjE3NzQ2Nn0.N8RXvK1Eh6X-muI3ynyqgGcKcFybnw4zZUtjCwibIV8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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
