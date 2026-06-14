export function generateErrorRef(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase()
  return `ERR-${date}-${rand}`
}
