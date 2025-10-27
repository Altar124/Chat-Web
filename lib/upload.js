import { symmetricEncrypt } from './crypto'

export async function compressImage(file, maxWidth = 1280, quality = 0.75) {
  if (!file.type.startsWith('image/')) return file
  const img = await createImageBitmap(file)
  const ratio = Math.min(1, maxWidth / img.width)
  const w = Math.round(img.width * ratio)
  const h = Math.round(img.height * ratio)
  const canvas = new OffscreenCanvas(w,h)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality })
  return blob
}

export async function encryptAndUpload(fileBlob, symKeyBase64, supabase) {
  const ab = await fileBlob.arrayBuffer()
  const bytes = new Uint8Array(ab)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  const b64 = btoa(binary)
  const ciphertext = symmetricEncrypt(symKeyBase64, b64)
  const name = `file-${Date.now()}`
  const { data, error } = await supabase.storage
    .from('chat-files')
    .upload(name, new Blob([ciphertext]), { contentType: 'application/octet-stream' })
  if (error) throw error
  const url = await supabase.storage.from('chat-files').createSignedUrl(data.path, 60*60*24*7)
  return { url: url.data.signedUrl, name }
}
