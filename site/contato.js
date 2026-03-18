document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const nome = form.nome.value;
        const email = form.email.value;
        const mensagem = form.mensagem.value;
        const whatsapp = form.whatsapp ? form.whatsapp.value : '';
        const data = new Date();
        const msg = {
            nome,
            email,
            mensagem,
            whatsapp,
            dataEnvio: `${data.getDate()}/${data.getMonth()+1}/${data.getFullYear()} ${data.getHours()}:${data.getMinutes()}`
        };
        // Salva mensagem no localStorage
        let mensagens = localStorage.getItem('mensagensRecebidas');
        mensagens = mensagens ? JSON.parse(mensagens) : [];
        mensagens.push(msg);
        localStorage.setItem('mensagensRecebidas', JSON.stringify(mensagens));
        // Simulação de envio de email
        alert('Mensagem enviada com sucesso!');
        form.reset();
    });
});