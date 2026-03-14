(function () {
    const STORAGE_STATUS = 'myhair_permissoes_status';

    function obterStatusPadrao() {
        return {
            notificacoes: 'pendente',
            localizacao: 'pendente',
            camera: 'pendente',
        };
    }

    function lerStatusSalvo() {
        try {
            return { ...obterStatusPadrao(), ...(JSON.parse(localStorage.getItem(STORAGE_STATUS) || '{}')) };
        } catch (error) {
            return obterStatusPadrao();
        }
    }

    function salvarStatus(status) {
        try {
            localStorage.setItem(STORAGE_STATUS, JSON.stringify(status));
        } catch (error) {
            // Sem bloqueio se localStorage estiver indisponivel.
        }
    }

    async function solicitarNotificacoes() {
        if (!('Notification' in window)) {
            return 'indisponivel';
        }
        if (Notification.permission === 'granted') {
            return 'granted';
        }
        if (Notification.permission === 'denied') {
            return 'denied';
        }
        try {
            const resultado = await Notification.requestPermission();
            return resultado;
        } catch (error) {
            return 'erro';
        }
    }

    async function diagnosticarNotificacoes() {
        if (!('Notification' in window)) {
            return 'indisponivel';
        }
        return Notification.permission === 'default' ? 'pendente' : Notification.permission;
    }

    async function solicitarLocalizacao() {
        if (!navigator.geolocation) {
            return 'indisponivel';
        }

        if (!window.isSecureContext) {
            return 'inseguro';
        }

        function obterPosicao(config) {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, config);
            });
        }

        try {
            await obterPosicao({ enableHighAccuracy: false, timeout: 9000, maximumAge: 120000 });
            return 'granted';
        } catch (erro) {
            if (erro && erro.code === 1) {
                return 'denied';
            }

            try {
                await obterPosicao({ enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
                return 'granted';
            } catch (erroFinal) {
                if (erroFinal && erroFinal.code === 1) {
                    return 'denied';
                }
                return 'erro';
            }
        }
    }

    async function diagnosticarLocalizacao() {
        if (!navigator.geolocation) {
            return 'indisponivel';
        }

        if (!window.isSecureContext) {
            return 'inseguro';
        }

        if (!navigator.permissions || !navigator.permissions.query) {
            return 'pendente';
        }

        try {
            const resultado = await navigator.permissions.query({ name: 'geolocation' });
            if (resultado.state === 'granted') return 'granted';
            if (resultado.state === 'denied') return 'denied';
            return 'pendente';
        } catch (error) {
            return 'pendente';
        }
    }

    async function solicitarCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return 'indisponivel';
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach((track) => track.stop());
            return 'granted';
        } catch (error) {
            if (error && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')) {
                return 'denied';
            }
            return 'erro';
        }
    }

    function textoStatus(valor) {
        if (valor === 'granted') return 'Autorizado';
        if (valor === 'denied') return 'Negado';
        if (valor === 'indisponivel') return 'Indisponivel';
        if (valor === 'inseguro') return 'Requer HTTPS';
        if (valor === 'erro') return 'Erro';
        return 'Pendente';
    }

    function mensagemPainel(status) {
        if (status.notificacoes === 'denied') {
            return 'Notificacoes negadas pelo navegador. Ative em Configuracoes do site.';
        }
        if (status.localizacao === 'inseguro') {
            return 'Localizacao requer HTTPS ou localhost para funcionar.';
        }
        if (status.localizacao === 'erro') {
            return 'Localizacao com erro. Verifique GPS/internet e tente novamente.';
        }
        return 'Permissoes opcionais: voce pode continuar usando o app normalmente.';
    }

    function atualizarPainel(status) {
        const elNot = document.getElementById('statusPermNotificacoes');
        const elGeo = document.getElementById('statusPermLocalizacao');
        const elCam = document.getElementById('statusPermCamera');
        const elInfo = document.getElementById('statusPermissoesInfo');
        if (elNot) elNot.textContent = textoStatus(status.notificacoes);
        if (elGeo) elGeo.textContent = textoStatus(status.localizacao);
        if (elCam) elCam.textContent = textoStatus(status.camera);
        if (elInfo) elInfo.textContent = mensagemPainel(status);
    }

    async function atualizarStatusSemSolicitar() {
        const status = lerStatusSalvo();
        status.notificacoes = await diagnosticarNotificacoes();
        status.localizacao = await diagnosticarLocalizacao();
        salvarStatus(status);
        atualizarPainel(status);
        return status;
    }

    async function solicitarPermissoesBasicas() {
        const status = lerStatusSalvo();
        status.notificacoes = await solicitarNotificacoes();
        status.localizacao = await solicitarLocalizacao();
        status.camera = await solicitarCamera();
        salvarStatus(status);
        atualizarPainel(status);
        return status;
    }

    async function solicitarPermissoesEssenciais() {
        const status = lerStatusSalvo();
        status.notificacoes = await solicitarNotificacoes();
        status.localizacao = await solicitarLocalizacao();
        salvarStatus(status);
        atualizarPainel(status);
        return status;
    }

    function initPainelPermissoes() {
        atualizarStatusSemSolicitar().catch(() => {
            const status = lerStatusSalvo();
            atualizarPainel(status);
        });
        const btn = document.getElementById('btnPermissoesApp');
        if (btn) {
            btn.addEventListener('click', async function () {
                btn.disabled = true;
                const textoOriginal = btn.textContent;
                btn.textContent = 'Solicitando permissoes...';
                await solicitarPermissoesBasicas();
                btn.textContent = textoOriginal;
                btn.disabled = false;
            });
        }
    }

    function podeNotificar() {
        return ('Notification' in window) && Notification.permission === 'granted';
    }

    window.MyHairPermissoes = {
        initPainelPermissoes,
        solicitarPermissoesBasicas,
        solicitarPermissoesEssenciais,
        solicitarNotificacoes,
        podeNotificar,
        lerStatusSalvo,
        atualizarStatusSemSolicitar,
    };
})();
