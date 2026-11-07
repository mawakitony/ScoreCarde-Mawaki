/** Public ScoreApp surfaces that must ignore the dashboard theme preference. */
export function forceLightPath(pathname: string | null | undefined) {
  if (!pathname) return false
  return (
    pathname.startsWith("/theme-preview") ||
    pathname.startsWith("/s/") ||
    pathname.startsWith("/r/") ||
    pathname.startsWith("/e2e/")
  )
}
