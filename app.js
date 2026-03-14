function gerarID() {
    // Gera algo como MH-2026-8742
    const ano = new Date().getFullYear();
    const aleatorio = Math.floor(1000 + Math.random() * 9000);
    return `MH-${ano}-${aleatorio}`;
}

window.gerarIdEIrParaCadastro = function() {
    const novoID = gerarID();
    localStorage.setItem('usuarioID', novoID); // Salva para usar na próxima tela
    window.location.href = "cadastrogeral.html"; // Vai direto para o cadastro
};