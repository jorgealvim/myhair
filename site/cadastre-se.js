document.addEventListener('DOMContentLoaded', function() {
    const formContainer = document.querySelector('section');
    formContainer.innerHTML = `
        <h2>Cadastre-se</h2>
        <div id="cadastro-box">
            <label for="tipoPessoa">Tipo de Pessoa:</label>
            <select id="tipoPessoa">
                <option value="fisica">Pessoa Física</option>
                <option value="juridica">Pessoa Jurídica</option>
            </select>
            <div id="formPessoa"></div>
        </div>
    `;

    const tipoPessoa = document.getElementById('tipoPessoa');
    const formPessoa = document.getElementById('formPessoa');

    function renderForm(tipo) {
        if (tipo === 'juridica') {
            formPessoa.innerHTML = `
                <form id="formJuridica">
                    <label>Nome:</label><input type="text" name="nome" required>
                    <label>Nome de Fantasia:</label><input type="text" name="nomeFantasia" required>
                    <label>Endereço Completo:</label><input type="text" name="enderecoCompleto" required>
                    <label>Rua:</label><input type="text" name="rua" required>
                    <label>Número:</label><input type="text" name="numero" required>
                    <label>Complemento:</label><input type="text" name="complemento">
                    <label>Bairro:</label><input type="text" name="bairro" required>
                    <label>Cidade:</label><input type="text" name="cidade" required>
                    <label>Estado:</label><input type="text" name="estado" required>
                    <label>CNPJ:</label><input type="text" name="cnpj" required>
                    <label>E-mail:</label><input type="email" name="email" required>
                    <label>Telefone WhatsApp:</label><input type="text" name="whatsapp" required>
                    <label>Responsável Jurídico:</label><input type="text" name="responsavelJuridico" required>
                    <label>Login:</label><input type="text" name="login" required>
                    <label>Senha:</label><input type="password" name="senha" required>
                    <label>Confirme a Senha:</label><input type="password" name="confirmaSenha" required>
                    <button type="submit">Salvar</button>
                </form>
            `;
        } else {
            formPessoa.innerHTML = `
                <form id="formFisica">
                    <label>Nome:</label><input type="text" name="nome" required>
                    <label>Endereço Completo:</label><input type="text" name="enderecoCompleto" required>
                    <label>Rua:</label><input type="text" name="rua" required>
                    <label>Número:</label><input type="text" name="numero" required>
                    <label>Complemento:</label><input type="text" name="complemento">
                    <label>Bairro:</label><input type="text" name="bairro" required>
                    <label>Cidade:</label><input type="text" name="cidade" required>
                    <label>Estado:</label><input type="text" name="estado" required>
                    <label>CNPJ:</label><input type="text" name="cnpj">
                    <label>E-mail:</label><input type="email" name="email" required>
                    <label>Telefone WhatsApp:</label><input type="text" name="whatsapp" required>
                    <label>Responsável Jurídico:</label><input type="text" name="responsavelJuridico" required>
                    <label>Número do CPF:</label><input type="text" name="cpf" required>
                    <label>Identidade:</label><input type="text" name="identidade" required>
                    <label>Nome do Pai:</label><input type="text" name="pai" required>
                    <label>Nome da Mãe:</label><input type="text" name="mae" required>
                    <label>Data de Nascimento:</label><input type="date" name="dataNascimento" required>
                    <label>Local de Trabalho:</label><input type="text" name="localTrabalho">
                    <label>Login:</label><input type="text" name="login" required>
                    <label>Senha:</label><input type="password" name="senha" required>
                    <label>Confirme a Senha:</label><input type="password" name="confirmaSenha" required>
                    <button type="submit">Salvar</button>
                </form>
            `;
        }
        bindFormSubmit(tipo);
    }

    tipoPessoa.addEventListener('change', function() {
        renderForm(this.value);
    });

    renderForm(tipoPessoa.value);

    function bindFormSubmit(tipo) {
        const form = tipo === 'juridica' ? document.getElementById('formJuridica') : document.getElementById('formFisica');
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const dados = {};
            Array.from(form.elements).forEach(el => {
                if (el.name) dados[el.name] = el.value;
            });
            // Validação de senha
            if (dados['senha'] !== dados['confirmaSenha']) {
                alert('As senhas não coincidem.');
                return;
            }
            // Simulação de salvamento local
            let cadastros = localStorage.getItem('cadastroGeral');
            cadastros = cadastros ? JSON.parse(cadastros) : [];
            cadastros.push(dados);
            localStorage.setItem('cadastroGeral', JSON.stringify(cadastros));
            // Mensagem de sucesso
            alert('Cadastro salvo com sucesso!');
            window.location.href = 'index.html';
        });
    }
});