// Função para sair de todas as contas e voltar para index.html, com confirmação de salvar dados
function fecharAplicativo() {
    const desejaSalvar = confirm('Deseja salvar os dados antes de fechar?');
    if (desejaSalvar) {
        // Chame aqui a função de salvar dados, se existir
        if (typeof salvarDadosApp === 'function') {
            salvarDadosApp();
        }
    }
    if (window.firebase && firebase.auth) {
        firebase.auth().signOut().then(function() {
            window.location.href = 'index.html';
        }).catch(function() {
            window.location.href = 'index.html';
        });
    } else {
        window.location.href = 'index.html';
    }
}
