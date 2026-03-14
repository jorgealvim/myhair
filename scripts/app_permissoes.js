(function () {
    const STORAGE_STATUS = 'myhair_permissoes_status';

    function lerStatusSalvo() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_STATUS) || '{}');
        } catch (error) {
            return {};
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

    async function solicitarLocalizacao() {
        if (!navigator.geolocation) {
            return 'indisponivel';
        }

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                () => resolve('granted'),
                (erro) => {
                    if (erro && erro.code === 1) {
                        resolve('denied');
                        return;
                    }
                    resolve('erro');
                },
                { enableHighAccuracy: false, timeout: 9000, maximumAge: 0 }
            );
        });
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
        if (valor === 'erro') return 'Erro';
        return 'Pendente';
    }

    function atualizarPainel(status) {
        const elNot = document.getElementById('statusPermNotificacoes');
        const elGeo = document.getElementById('statusPermLocalizacao');
        const elCam = document.getElementById('statusPermCamera');
        if (elNot) elNot.textContent = textoStatus(status.notificacoes);
        if (elGeo) elGeo.textContent = textoStatus(status.localizacao);
        if (elCam) elCam.textContent = textoStatus(status.camera);
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

    function initPainelPermissoes() {
        const status = lerStatusSalvo();
        atualizarPainel(status);
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
        solicitarNotificacoes,
        podeNotificar,
        lerStatusSalvo,
    };
})();
