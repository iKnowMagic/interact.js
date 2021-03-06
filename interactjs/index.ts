import '@interactjs/types'
import interact from '@interactjs/interactjs/index'

export default interact

if (typeof module === 'object' && !!module) {
  try { module.exports = interact }
  catch {}
}

(interact as any).default = interact
