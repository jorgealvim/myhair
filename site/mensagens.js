document.addEventListener('DOMContentLoaded', function() {
    const section = document.querySelector('section');
    section.innerHTML += `
        <div style='margin-top:30px;'>
            <h3>Mensagens Recebidas</h3>
            <div id='boxMensagens'></div>
        </div>
    `;
    const box = document.getElementById('boxMensagens');
    let mensagens = localStorage.getItem('mensagensRecebidas');
    mensagens = mensagens ? JSON.parse(mensagens) : [];
    if (mensagens.length === 0) {
        box.innerHTML = '<p>Nenhuma mensagem recebida.</p>';
    } else {
        box.innerHTML = mensagens.map((m, idx) => {
            return `<div class='cadastro-box'>
                <strong>Data:</strong> ${m.dataEnvio}<br>
                <strong>Nome:</strong> ${m.nome}<br>
                <strong>E-mail:</strong> ${m.email}<br>
                <strong>WhatsApp:</strong> ${m.whatsapp}<br>
                <strong>Mensagem:</strong> ${m.mensagem}<br>
                <button onclick="window.location.href='mailto:${m.email}'">Responder por E-mail</button>
                <button onclick="window.open('https://wa.me/${m.whatsapp.replace(/\D/g,'')}', '_blank')">Responder por WhatsApp</button>
            </div>`;
        }).join('');
    }
});