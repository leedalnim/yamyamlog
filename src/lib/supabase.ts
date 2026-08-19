/**
 * Supabase 클라이언트.
 *
 * 설정값이 없으면 null을 돌려준다. 앱은 그래도 평소처럼 동작해야 한다 —
 * 기록은 원래 이 기기(IndexedDB)에 있고, 클라우드는 두 기기를 맞춰주는
 * 역할일 뿐이기 때문이다. 무료 플랜 프로젝트가 잠들어 있어도 마찬가지다.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isCloudConfigured = Boolean(URL && KEY)

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!isCloudConfigured) return null
  if (!client) {
    client = createClient(URL!, KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'yamyamlog-auth',
      },
    })
  }
  return client
}

/**
 * 기기 신원 확보 — 익명 로그인.
 * 회원가입 없이 기기마다 사용자 ID만 하나 만든다. 이게 있어야 서버가
 * "이 사람이 우리집 구성원인가"를 판단할 수 있다.
 */
export async function ensureSignedIn(): Promise<string | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data } = await sb.auth.getSession()
  if (data.session?.user) return data.session.user.id
  const { data: signed, error } = await sb.auth.signInAnonymously()
  if (error) throw error
  return signed.user?.id ?? null
}
