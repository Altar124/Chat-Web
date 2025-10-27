import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import * as crypto from '../lib/crypto'
import { compressImage, encryptAndUpload } from '../lib/upload'

export default function Home() {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [profile, setProfile] = useState(null)
  const [room, setRoom] = useState(null)
  const messagesRef = useRef(null)

  useEffect(() => {
    let stored = localStorage.getItem('my_profile')
    if (!stored) {
      const kp = crypto.genKeypair()
      const p = { id: 'local-'+Date.now(), username: 'Anon', public_key: kp.publicKey, secret_key: kp.secretKey }
      localStorage.setItem('my_profile', JSON.stringify(p))
      setProfile(p)
      supabase.from('profiles').upsert({ id: p.id, username: p.username, public_key: p.public_key }).then(()=>{})
    } else setProfile(JSON.parse(stored))
  }, [])

  useEffect(() => {
    if (!room) return
    supabase.from('messages')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true })
      .then(r => { if (r.data) setMessages(r.data) })

    const sub = supabase.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${room.id}` }, payload => {
        setMessages(prev => [...prev, payload.new])
      }).subscribe()

    return () => supabase.removeChannel(sub)
  }, [room])

  useEffect(() => { messagesRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendText = async () => {
    if (!text.trim() || !profile || !room) return
    const symKey = localStorage.getItem(`roomkey:${room.id}`)
    const cipher = crypto.symmetricEncrypt(symKey, JSON.stringify({ type: 'text', body: text }))
    await supabase.from('messages').insert([{ room_id: room.id, sender_id: profile.id, ciphertext: cipher }])
    setText('')
  }

  const onFile = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    const compressed = await compressImage(f)
    const symKey = localStorage.getItem(`roomkey:${room.id}`)
    const { url, name } = await encryptAndUpload(compressed, symKey, supabase)
    const payload = { type: 'file', name: f.name, url }
    const cipher = crypto.symmetricEncrypt(symKey, JSON.stringify(payload))
    await supabase.from('messages').insert([{ room_id: room.id, sender_id: profile.id, ciphertext: cipher, attachments: [{name: f.name, url}] }])
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow p-4 grid grid-cols-3 gap-4">
        <aside className="col-span-1 border-r pr-2">
          <div className="font-bold mb-2">Rooms</div>
          <button className="w-full py-2 text-left" onClick={async ()=>{
            const r = { id: 'room-demo', name: 'Demo Room' }
            setRoom(r)
            if (!localStorage.getItem(`roomkey:${r.id}`)) {
              // simplified sym key for demo
              const symBase64 = btoa(String.fromCharCode(...new Uint8Array(32).map(()=>Math.floor(Math.random()*256))))
              localStorage.setItem(`roomkey:${r.id}`, symBase64)
            }
          }}># Demo Room</button>
        </aside>

        <main className="col-span-2 flex flex-col">
          <header className="border-b pb-2 mb-2">
            <div className="font-semibold">{room ? room.name : 'Pilih room'}</div>
          </header>
          <div className="flex-1 overflow-auto mb-2">
            {messages.map((m,i)=>(
              <Message key={m.id||i} msg={m} myId={profile?.id} roomKey={localStorage.getItem(`roomkey:${room?.id}`)} />
            ))}
            <div ref={messagesRef} />
          </div>

          <div className="flex gap-2">
            <input className="flex-1 p-2 border rounded" value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') sendText() }} placeholder="Ketik pesan..." />
            <input type="file" id="file" className="hidden" onChange={onFile} />
            <label htmlFor="file" className="btn p-2 border rounded cursor-pointer">Attach</label>
            <button onClick={sendText} className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
          </div>
        </main>
      </div>
    </div>
  )
}

function Message({ msg, myId, roomKey }) {
  const [plain, setPlain] = useState(null)
  useEffect(() => {
    if (!roomKey) return
    try {
      const p = crypto.symmetricDecrypt(roomKey, msg.ciphertext)
      setPlain(JSON.parse(p))
    } catch (e) { setPlain({ type:'unknown', body:'<cannot-decrypt>' }) }
  }, [msg, roomKey])
  if (!plain) return <div className="text-sm text-gray-400">Loading...</div>
  return (
    <div className={`mb-2 ${msg.sender_id===myId ? 'text-right' : ''}`}>
      <div className="inline-block p-2 rounded-lg bg-gray-100">
        {plain.type==='text' && <div>{plain.body}</div>}
        {plain.type==='file' && <a href={plain.url} target="_blank" rel="noreferrer" className="underline">{plain.name}</a>}
      </div>
    </div>
  )
}
