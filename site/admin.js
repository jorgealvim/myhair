document.addEventListener('DOMContentLoaded', function() {
    // Adiciona cadastros de teste se não existirem
    let cadastros = localStorage.getItem('cadastroGeral');
    cadastros = cadastros ? JSON.parse(cadastros) : [];
    if (cadastros.length < 4) {
        cadastros = [
            {
                nome: 'Empresa Alpha', nomeFantasia: 'Alpha Serviços', enderecoCompleto: 'Rua A, 100, Centro, São Paulo, SP', rua: 'Rua A', numero: '100', complemento: '', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', cnpj: '12.345.678/0001-99', email: 'contato@alpha.com', whatsapp: '(11)99999-0001', responsavelJuridico: 'Carlos Silva', login: 'alpha', senha: '123456', confirmaSenha: '123456',
            },
            {
                nome: 'Empresa Beta', nomeFantasia: 'Beta Consultoria', enderecoCompleto: 'Av. B, 200, Jardim, Rio de Janeiro, RJ', rua: 'Av. B', numero: '200', complemento: 'Sala 2', bairro: 'Jardim', cidade: 'Rio de Janeiro', estado: 'RJ', cnpj: '98.765.432/0001-88', email: 'beta@consultoria.com', whatsapp: '(21)98888-0002', responsavelJuridico: 'Ana Souza', login: 'beta', senha: 'abcdef', confirmaSenha: 'abcdef',
            },
            {
                nome: 'João Pereira', enderecoCompleto: 'Rua C, 300, Bairro Novo, Belo Horizonte, MG', rua: 'Rua C', numero: '300', complemento: '', bairro: 'Bairro Novo', cidade: 'Belo Horizonte', estado: 'MG', cnpj: '', email: 'joao@gmail.com', whatsapp: '(31)97777-0003', responsavelJuridico: 'João Pereira', cpf: '123.456.789-00', identidade: 'MG-123456', pai: 'José Pereira', mae: 'Maria Pereira', dataNascimento: '1980-05-10', localTrabalho: 'Empresa X', login: 'joao', senha: 'joao123', confirmaSenha: 'joao123',
            },
            {
                nome: 'Maria Oliveira', enderecoCompleto: 'Av. D, 400, Centro, Curitiba, PR', rua: 'Av. D', numero: '400', complemento: 'Apto 10', bairro: 'Centro', cidade: 'Curitiba', estado: 'PR', cnpj: '', email: 'maria@gmail.com', whatsapp: '(41)96666-0004', responsavelJuridico: 'Maria Oliveira', cpf: '987.654.321-00', identidade: 'PR-654321', pai: 'Carlos Oliveira', mae: 'Ana Oliveira', dataNascimento: '1992-11-20', localTrabalho: 'Empresa Y', login: 'maria', senha: 'maria123', confirmaSenha: 'maria123',
            }
        ];
        localStorage.setItem('cadastroGeral', JSON.stringify(cadastros));
    }
    const section = document.querySelector('section');
    section.innerHTML += `
        <div style="margin-top:30px;">
            <label for="buscaCadastro">Buscar cadastro:</label>
            <input type="text" id="buscaCadastro" placeholder="Digite nome, email, CPF ou CNPJ">
            <button id="btnBusca" style="background:none;border:none;cursor:pointer;vertical-align:middle;">
                <span style="font-size:24px;">🔍</span>
            </button>
        </div>
        <div id="resultadoBusca" style="margin-top:20px;"></div>
    `;

    document.getElementById('btnBusca').addEventListener('click', function() {
        const termo = document.getElementById('buscaCadastro').value.trim().toLowerCase();
        const resultado = document.getElementById('resultadoBusca');
        let cadastros = localStorage.getItem('cadastroGeral');
        cadastros = cadastros ? JSON.parse(cadastros) : [];
        const encontrados = cadastros.filter(c => {
            return (
                (c.nome && c.nome.toLowerCase().includes(termo)) ||
                (c.email && c.email.toLowerCase().includes(termo)) ||
                (c.cpf && c.cpf.toLowerCase().includes(termo)) ||
                (c.cnpj && c.cnpj.toLowerCase().includes(termo))
            );
        });
        if (encontrados.length === 0) {
            resultado.innerHTML = '<p>Nenhum cadastro encontrado.</p>';
        } else {
            resultado.innerHTML = encontrados.map((c, idx) => {
                const id = 'cadastro_' + idx;
                return `<div id='${id}' style='border:1px solid #ccc;padding:10px;margin-bottom:10px;border-radius:6px;'>
                    <strong>Nome:</strong> <span class='editavel' data-campo='nome'>${c.nome || ''}</span><br>
                    <strong>Nome de Fantasia:</strong> <span class='editavel' data-campo='nomeFantasia'>${c.nomeFantasia || ''}</span><br>
                    <strong>Endereço Completo:</strong> <span class='editavel' data-campo='enderecoCompleto'>${c.enderecoCompleto || ''}</span><br>
                    <strong>Rua:</strong> <span class='editavel' data-campo='rua'>${c.rua || ''}</span><br>
                    <strong>Número:</strong> <span class='editavel' data-campo='numero'>${c.numero || ''}</span><br>
                    <strong>Complemento:</strong> <span class='editavel' data-campo='complemento'>${c.complemento || ''}</span><br>
                    <strong>Bairro:</strong> <span class='editavel' data-campo='bairro'>${c.bairro || ''}</span><br>
                    <strong>Cidade:</strong> <span class='editavel' data-campo='cidade'>${c.cidade || ''}</span><br>
                    <strong>Estado:</strong> <span class='editavel' data-campo='estado'>${c.estado || ''}</span><br>
                    <strong>CNPJ:</strong> <span class='editavel' data-campo='cnpj'>${c.cnpj || ''}</span><br>
                    <strong>CPF:</strong> <span class='editavel' data-campo='cpf'>${c.cpf || ''}</span><br>
                    <strong>Identidade:</strong> <span class='editavel' data-campo='identidade'>${c.identidade || ''}</span><br>
                    <strong>Nome do Pai:</strong> <span class='editavel' data-campo='pai'>${c.pai || ''}</span><br>
                    <strong>Nome da Mãe:</strong> <span class='editavel' data-campo='mae'>${c.mae || ''}</span><br>
                    <strong>Data de Nascimento:</strong> <span class='editavel' data-campo='dataNascimento'>${c.dataNascimento || ''}</span><br>
                    <strong>Local de Trabalho:</strong> <span class='editavel' data-campo='localTrabalho'>${c.localTrabalho || ''}</span><br>
                    <strong>E-mail:</strong> <span class='editavel' data-campo='email'>${c.email || ''}</span><br>
                    <strong>Telefone WhatsApp:</strong> <span class='editavel' data-campo='whatsapp'>${c.whatsapp || ''}</span><br>
                    <strong>Responsável Jurídico:</strong> <span class='editavel' data-campo='responsavelJuridico'>${c.responsavelJuridico || ''}</span><br>
                    <strong>Login:</strong> <span class='editavel' data-campo='login'>${c.login || ''}</span><br>
                    <strong>Senha:</strong> <span class='editavel' data-campo='senha'>${c.senha || ''}</span><br>
                    <strong>Tipo:</strong> ${c.cpf ? 'Pessoa Física' : 'Pessoa Jurídica'}<br>
                    <button class='btn-editar' data-idx='${idx}'>Editar</button>
                    <button class='btn-excluir' data-idx='${idx}'>Excluir</button>
                    <button class='btn-salvar' data-idx='${idx}' disabled>Salvar</button>
                </div>`;
            }).join('');

            // Funções dos botões
            document.querySelectorAll('.btn-editar').forEach(btn => {
                btn.addEventListener('click', function() {
                    const idx = this.dataset.idx;
                    const box = this.parentElement;
                    box.querySelectorAll('.editavel').forEach(span => {
                        const campo = span.dataset.campo;
                        const valor = span.textContent;
                        span.innerHTML = `<input type='text' value='${valor}' data-campo='${campo}'>`;
                    });
                    box.querySelector('.btn-editar').disabled = true;
                    box.querySelector('.btn-salvar').disabled = false;
                });
            });
            document.querySelectorAll('.btn-salvar').forEach(btn => {
                btn.addEventListener('click', function() {
                    const idx = this.dataset.idx;
                    const box = this.parentElement;
                    let cadastros = localStorage.getItem('cadastroGeral');
                    cadastros = cadastros ? JSON.parse(cadastros) : [];
                    box.querySelectorAll('.editavel').forEach(span => {
                        const campo = span.dataset.campo;
                        const input = span.querySelector('input');
                        if (input) cadastros[idx][campo] = input.value;
                        span.textContent = input ? input.value : span.textContent;
                    });
                    localStorage.setItem('cadastroGeral', JSON.stringify(cadastros));
                    box.querySelector('.btn-editar').disabled = false;
                    box.querySelector('.btn-salvar').disabled = true;
                    alert('Cadastro salvo!');
                });
            });
            document.querySelectorAll('.btn-excluir').forEach(btn => {
                btn.addEventListener('click', function() {
                    const idx = this.dataset.idx;
                    let cadastros = localStorage.getItem('cadastroGeral');
                    cadastros = cadastros ? JSON.parse(cadastros) : [];
                    cadastros.splice(idx, 1);
                    localStorage.setItem('cadastroGeral', JSON.stringify(cadastros));
                    this.parentElement.remove();
                    alert('Cadastro excluído!');
                });
            });
        }
    });
});