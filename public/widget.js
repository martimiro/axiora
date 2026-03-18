(function() {
  var config = window.AxioraConfig || {}
  var agentId = config.agentId
  if (!agentId) return console.error('Axiora: agentId no configurado')

  var apiUrl = config.apiUrl || 'https://axiora-murex.vercel.app'
  var sessionId = 'widget_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()

  var styles = `
    #axiora-widget { position: fixed; bottom: 24px; right: 24px; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #axiora-btn { width: 56px; height: 56px; border-radius: 50%; background: #4ade80; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(74,222,128,0.4); transition: transform 0.2s; }
    #axiora-btn:hover { transform: scale(1.05); }
    #axiora-btn svg { width: 24px; height: 24px; fill: #080808; }
    #axiora-box { display: none; position: absolute; bottom: 70px; right: 0; width: 340px; background: #0f0f0f; border: 1px solid #1a1a1a; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
    #axiora-box.open { display: flex; flex-direction: column; }
    #axiora-header { background: #080808; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1a1a1a; }
    #axiora-header-left { display: flex; align-items: center; gap: 8px; }
    #axiora-status { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 6px #4ade80; }
    #axiora-title { font-size: 13px; color: #d4d0c8; font-weight: 500; }
    #axiora-subtitle { font-size: 11px; color: #444; }
    #axiora-close { background: none; border: none; color: #444; cursor: pointer; font-size: 18px; padding: 0; line-height: 1; }
    #axiora-msgs { height: 320px; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .axiora-msg { max-width: 80%; padding: 8px 12px; border-radius: 8px; font-size: 13px; line-height: 1.5; }
    .axiora-msg.user { background: #1a1a1a; color: #d4d0c8; align-self: flex-end; border-bottom-right-radius: 2px; }
    .axiora-msg.bot { background: #141414; color: #d4d0c8; align-self: flex-start; border-bottom-left-radius: 2px; border: 1px solid #222; }
    .axiora-msg.typing { color: #444; font-style: italic; }
    #axiora-input-row { display: flex; border-top: 1px solid #1a1a1a; }
    #axiora-input { flex: 1; background: #0a0a0a; border: none; outline: none; padding: 12px 14px; color: #d4d0c8; font-size: 13px; font-family: inherit; }
    #axiora-input::placeholder { color: #333; }
    #axiora-send { background: #4ade80; border: none; padding: 0 16px; cursor: pointer; color: #080808; font-size: 16px; transition: background 0.2s; }
    #axiora-send:hover { background: #22c55e; }
    #axiora-powered { text-align: center; padding: 6px; font-size: 10px; color: #1a1a1a; background: #080808; }
  `

  var el = document.createElement('style')
  el.textContent = styles
  document.head.appendChild(el)

  var html = `
    <div id="axiora-widget">
      <div id="axiora-box">
        <div id="axiora-header">
          <div id="axiora-header-left">
            <div id="axiora-status"></div>
            <div>
              <div id="axiora-title">${config.title || 'Asistente virtual'}</div>
              <div id="axiora-subtitle">${config.subtitle || 'Responde al instante'}</div>
            </div>
          </div>
          <button id="axiora-close">×</button>
        </div>
        <div id="axiora-msgs"></div>
        <div id="axiora-input-row">
          <input id="axiora-input" placeholder="${config.placeholder || 'Escribe un mensaje...'}" />
          <button id="axiora-send">→</button>
        </div>
        <div id="axiora-powered">Powered by Axiora</div>
      </div>
      <button id="axiora-btn">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </button>
    </div>
  `

  var container = document.createElement('div')
  container.innerHTML = html
  document.body.appendChild(container)

  var box = document.getElementById('axiora-box')
  var btn = document.getElementById('axiora-btn')
  var closeBtn = document.getElementById('axiora-close')
  var msgs = document.getElementById('axiora-msgs')
  var input = document.getElementById('axiora-input')
  var send = document.getElementById('axiora-send')
  var opened = false

  btn.addEventListener('click', function() {
    opened = !opened
    box.classList.toggle('open', opened)
    if (opened && msgs.children.length === 0) {
      addMsg('bot', config.greeting || '¡Hola! ¿En qué puedo ayudarte hoy?')
    }
    if (opened) input.focus()
  })

  closeBtn.addEventListener('click', function() {
    opened = false
    box.classList.remove('open')
  })

  function addMsg(type, text) {
    var div = document.createElement('div')
    div.className = 'axiora-msg ' + type
    div.textContent = text
    msgs.appendChild(div)
    msgs.scrollTop = msgs.scrollHeight
    return div
  }

  async function sendMsg() {
    var text = input.value.trim()
    if (!text) return
    input.value = ''
    addMsg('user', text)
    var typing = addMsg('bot typing', 'Escribiendo...')

    try {
      var res = await fetch(apiUrl + '/api/widget/' + agentId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: sessionId })
      })
      var data = await res.json()
      typing.remove()
      addMsg('bot', data.reply || 'Lo siento, ha ocurrido un error.')
    } catch(e) {
      typing.remove()
      addMsg('bot', 'Error de conexión. Inténtalo de nuevo.')
    }
  }

  send.addEventListener('click', sendMsg)
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sendMsg()
  })
})()
