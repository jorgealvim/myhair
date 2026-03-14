(function () {
    const adminEmails = [
        'admin@myhair.test',
        'salao1@myhair.test'
    ];

    const firebaseConfig = {
        apiKey: 'AIzaSyBU0ctjAg0FUXT-NXjsTqmr5zta5VMKo-0',
        authDomain: 'my-hair-v2.firebaseapp.com',
        projectId: 'my-hair-v2',
        storageBucket: 'my-hair-v2.appspot.com',
        messagingSenderId: '672931938550',
        appId: '1:672931938550:web:fb7ffd0cd9f0fd95236cd7'
    };

    function flagDevAtiva(valor) {
        const texto = String(valor || '').trim().toLowerCase();
        return texto === '1' || texto === 'true' || texto === 'dev' || texto === 'on' || texto === 'yes' || texto === 'sim';
    }

    function normalizarEmail(valor) {
        return String(valor || '').trim().toLowerCase();
    }

    function getAdminEmails() {
        return adminEmails.slice();
    }

    function isAdminEmail(email) {
        return getAdminEmails().includes(normalizarEmail(email));
    }

    function sanitizarId(valor) {
        return String(valor || '').replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    function parseMoeda(valor) {
        if (typeof valor === 'number') {
            return Number.isFinite(valor) ? valor : 0;
        }

        const numero = String(valor || '')
            .replace(/\s/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
            .replace(/[^\d.-]/g, '');

        const convertido = Number(numero);
        return Number.isFinite(convertido) ? convertido : 0;
    }

    function formatarMoeda(valor) {
        return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`;
    }

    function hojeISO() {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    }

    function comporRelacaoId(deId, paraId) {
        const deSafe = sanitizarId(deId);
        const paraSafe = sanitizarId(paraId);
        return `fav_${deSafe}__${paraSafe}`;
    }

    function ensureFirebaseApp() {
        if (typeof firebase === 'undefined') {
            return null;
        }

        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        return firebase.app();
    }

    window.MyHairCore = {
        adminEmails: getAdminEmails(),
        firebaseConfig,
        flagDevAtiva,
        normalizarEmail,
        getAdminEmails,
        isAdminEmail,
        sanitizarId,
        parseMoeda,
        formatarMoeda,
        hojeISO,
        comporRelacaoId,
        ensureFirebaseApp,
    };
})();