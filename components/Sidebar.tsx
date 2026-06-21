'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/lancamentos', label: 'Lançamentos', icon: '↕' },
  { href: '/importar', label: 'Importar', icon: '↓' },
  { href: '/pendentes', label: 'Pendentes', icon: '⏱' },
  { href: '/fechamentos', label: 'Fechamentos', icon: '📅' },
  { href: '/categorias', label: 'Categorias', icon: '☰' },
]

export default function Sidebar() {
  const path = usePathname()
  const router = useRouter()

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside style={{ width: 240, minHeight: '100vh', background: '#111827', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid #374151', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, background: '#4f46e5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>$</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Painel Financeiro</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>Fechamento de Caixa</div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
        {nav.map(n => (
          <Link key={n.href} href={n.href} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 2,
            textDecoration: 'none',
            background: path === n.href ? '#4f46e5' : 'transparent',
            color: path === n.href ? '#fff' : '#9ca3af',
          }}>
            <span>{n.icon}</span>{n.label}
          </Link>
        ))}
      </nav>
      <div style={{ padding: 12, borderTop: '1px solid #374151' }}>
        <button onClick={sair} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
          ⎋ Sair
        </button>
      </div>
    </aside>
  )
}
