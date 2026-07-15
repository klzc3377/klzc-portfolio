function addSecurityHeaders(response) {
  const headers = new Headers(response.headers)
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)
    if (response.status !== 404 || request.method !== 'GET') {
      return addSecurityHeaders(response)
    }

    const accept = request.headers.get('accept') ?? ''
    const pathname = new URL(request.url).pathname
    const lastSegment = pathname.split('/').filter(Boolean).at(-1) ?? ''
    const isDocumentRequest = accept.includes('text/html') || !lastSegment.includes('.')

    if (!isDocumentRequest) {
      return addSecurityHeaders(response)
    }

    const fallbackUrl = new URL('/index.html', request.url)
    const fallbackRequest = new Request(fallbackUrl, request)
    return addSecurityHeaders(await env.ASSETS.fetch(fallbackRequest))
  },
}
