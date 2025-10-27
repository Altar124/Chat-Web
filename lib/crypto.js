import sodium from 'libsodium-wrappers'

let ready = false
export async function _init() {
  if (!ready) {
    await sodium.ready
    ready = true
  }
}

export function genKeypair() {
  const kp = sodium.crypto_box_keypair()
  return {
    publicKey: sodium.to_base64(kp.publicKey, sodium.base64_variants.ORIGINAL),
    secretKey: sodium.to_base64(kp.privateKey, sodium.base64_variants.ORIGINAL)
  }
}

export function symmetricEncrypt(symKeyBase64, plainText) {
  const key = sodium.from_base64(symKeyBase64, sodium.base64_variants.ORIGINAL)
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
  const cipher = sodium.crypto_secretbox_easy(sodium.from_string(plainText), nonce, key)
  return sodium.to_base64(new Uint8Array([...nonce, ...cipher]), sodium.base64_variants.ORIGINAL)
}

export function symmetricDecrypt(symKeyBase64, ciphertextBase64) {
  const key = sodium.from_base64(symKeyBase64, sodium.base64_variants.ORIGINAL)
  const data = sodium.from_base64(ciphertextBase64, sodium.base64_variants.ORIGINAL)
  const nonce = data.slice(0, sodium.crypto_secretbox_NONCEBYTES)
  const cipher = data.slice(sodium.crypto_secretbox_NONCEBYTES)
  const plain = sodium.crypto_secretbox_open_easy(cipher, nonce, key)
  return sodium.to_string(plain)
}
