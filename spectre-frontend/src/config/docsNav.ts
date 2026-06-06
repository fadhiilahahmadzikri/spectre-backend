export type NavMethod = 'POST' | 'GET' | 'DEL' | 'PUT' | 'PATCH'

export interface NavItem {
  label: string
  href: string
  method?: NavMethod
  icon?: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const docsNav: NavGroup[] = [
  {
    title: 'Getting Started',
    items: [
      { label: 'Introduction', href: '/docs/introduction' },
      { label: 'Quickstart', href: '/docs/quickstart', icon: 'Zap' },
      { label: 'Authentication', href: '/docs/authentication', icon: 'KeyRound' },
      { label: 'Rate Limits', href: '/docs/rate-limits' },
    ],
  },
  {
    title: 'Face Operations',
    items: [
      { label: 'Register Face', href: '/docs/register-face', method: 'POST' },
      { label: 'Authenticate Face', href: '/docs/authenticate-face', method: 'POST' },
      { label: 'Replace Face', href: '/docs/replace-face', method: 'POST' },
      { label: 'Delete Face', href: '/docs/delete-face', method: 'DEL' },
    ],
  },
  {
    title: 'Sessions',
    items: [{ label: 'Get Session', href: '/docs/get-session', method: 'GET' }],
  },
  {
    title: 'Tenant Management',
    items: [{ label: 'API Keys', href: '/docs/api-keys', icon: 'KeyRound' }],
  },
  {
    title: 'Reference',
    items: [
      { label: 'Error Codes', href: '/docs/error-codes' },
      { label: 'Response Schema', href: '/docs/response-schema' },
      { label: 'Security', href: '/docs/security' },
    ],
  },
]
