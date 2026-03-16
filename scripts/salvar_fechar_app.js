// Função global para salvar e fechar
function salvarEDepoisFecharApp() {
    if (typeof salvarDadosApp === 'function') {
        salvarDadosApp();
    }
    fecharAplicativo();
}
