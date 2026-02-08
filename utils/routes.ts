export const routes = {
  home: () => '/' as const,
  signIn: () => '/auth/sign-in' as const,
  dashboard: () => '/dashboard' as const,
}
