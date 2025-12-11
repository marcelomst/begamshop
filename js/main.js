// --- AUTENTICACIÓN FIREBASE ---
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { initializeFirestore, connectFirestoreEmulator, doc, setDoc, getDocFromServer, updateDoc, collection, getDocsFromServer } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Configuración real de tu proyecto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyApKQhQXbdaSD8cYRHCXPx-Qhm0UtMRU_E",
    authDomain: "begamshop-4b22b.firebaseapp.com",
    projectId: "begamshop-4b22b",
    storageBucket: "begamshop-4b22b.appspot.com",
    messagingSenderId: "277857400576",
    appId: "1:277857400576:web:26f1f1bf240271e8bde5e5",
    measurementId: "G-XM41LZEWBH"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Forzar long polling para evitar errores de WebChannel tras Nginx/containers
const db = initializeFirestore(app, { experimentalForceLongPolling: true, useFetchStreams: false });

// Conectar a emuladores en local
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    try {
        // Puerto configurado en firebase.json para Firestore: 8085
        // Usar localhost para evitar problemas de loopback/cors y proxies
        connectFirestoreEmulator(db, 'localhost', 8085);
    } catch (e) {
        console.warn('No se pudo conectar al emulador de Firestore:', e);
    }
    try {
        // Auth Emulator en puerto por defecto 9099 (usar localhost para evitar fallos CORS)
        connectAuthEmulator(auth, 'http://localhost:9099');
    } catch (e) {
        console.warn('No se pudo conectar al emulador de Auth:', e);
    }
}

// --- Catálogo mock de respaldo si Firestore está vacío ---
const mockCatalog = [
    {
        id: '001',
        nombre: 'Producto 001',
        precio: 100,
        stock: 10,
        descripcionCompleta: 'Descripción del producto 001',
        imagenes: ['assets/images/001_1.jpeg','assets/images/001_2.jpg']
    },
    {
        id: '002',
        nombre: 'Producto 002',
        precio: 120,
        stock: 8,
        descripcionCompleta: 'Descripción del producto 002',
        imagenes: ['assets/images/002_1.jpeg','assets/images/002_2.jpg']
    },
    {
        id: '003',
        nombre: 'Producto 003',
        precio: 95,
        stock: 12,
        descripcionCompleta: 'Descripción del producto 003',
        imagenes: ['assets/images/003_1.jpeg','assets/images/003_2.jpg']
    },
    {
        id: '004',
        nombre: 'Producto 004',
        precio: 110,
        stock: 6,
        descripcionCompleta: 'Descripción del producto 004',
        imagenes: ['assets/images/004_1.jpeg','assets/images/004_2.jpg']
    },
    {
        id: '005',
        nombre: 'Producto 005',
        precio: 130,
        stock: 9,
        descripcionCompleta: 'Descripción del producto 005',
        imagenes: ['assets/images/005_1.jpeg','assets/images/005_2.jpg']
    },
    {
        id: '006',
        nombre: 'Producto 006',
        precio: 150,
        stock: 7,
        descripcionCompleta: 'Descripción del producto 006',
        imagenes: ['assets/images/006_1.jpeg','assets/images/006_2.jpg','assets/images/006_3.jpg']
    },
    {
        id: '007',
        nombre: 'Producto 007',
        precio: 90,
        stock: 15,
        descripcionCompleta: 'Descripción del producto 007',
        imagenes: ['assets/images/007_1.jpeg','assets/images/007_2.jpg']
    }
];

// Si no existe catálogo o está vacío, usar mock temporal
if (!window.catalog || !Array.isArray(window.catalog) || window.catalog.length === 0) {
    window.catalog = mockCatalog;
}

// Referencias a formularios y vistas de autenticación
// --- PERFIL DE EMPRESA ---
const empresaProfileSection = document.getElementById('empresa-profile');
const empresaLogoInput = document.getElementById('empresa-logo');
const empresaLogoPreview = document.getElementById('empresa-logo-preview');
const empresaNombre = document.getElementById('empresa-nombre');
const empresaDireccion = document.getElementById('empresa-direccion');
const empresaTelefono = document.getElementById('empresa-telefono');
const empresaEmail = document.getElementById('empresa-email');
const empresaDescripcion = document.getElementById('empresa-descripcion');
const empresaSlogan = document.getElementById('empresa-slogan');
const empresaCoverInput = document.getElementById('empresa-cover');
const empresaCoverPreview = document.getElementById('empresa-cover-preview');
const empresaCurrency = document.getElementById('empresa-currency');
const empresaFacebook = document.getElementById('empresa-facebook');
const empresaInstagram = document.getElementById('empresa-instagram');
const empresaWhatsapp = document.getElementById('empresa-whatsapp');
const empresaWeb = document.getElementById('empresa-web');
const empresaGuardarBtn = document.getElementById('empresa-guardar');
const empresaMsg = document.getElementById('empresa-msg');

// Por defecto ocultar la sección de empresa
if (empresaProfileSection) empresaProfileSection.style.display = 'none';

// Solo mostrar la sección si el usuario es admin
const ADMIN_EMAIL = 'begamshop.ventas@gmail.com'; // Cambia esto por el email real del admin
onAuthStateChanged(auth, (user) => {
    if (empresaProfileSection) {
        if (user && user.email === ADMIN_EMAIL) {
            empresaProfileSection.style.display = '';
        } else {
            empresaProfileSection.style.display = 'none';
        }
    }
});

// Cargar perfil de empresa al iniciar
async function loadEmpresaProfile() {
    try {
        const docRef = doc(db, 'config', 'empresa');
        const snap = await getDocFromServer(docRef);
        if (snap.exists()) {
            const data = snap.data();
            window.defaultCurrency = data.defaultCurrency || 'USD';
            if (empresaCurrency) {
                // Establecer valor del selector según configuración o USD por defecto
                const val = window.defaultCurrency || 'USD';
                // Si no existe en la lista, seleccionar USD
                const exists = Array.from(empresaCurrency.options).some(o => o.value === val);
                empresaCurrency.value = exists ? val : 'USD';
            }
            if (empresaNombre) empresaNombre.value = data.nombre || '';
            if (empresaDireccion) empresaDireccion.value = data.direccion || '';
            if (empresaTelefono) empresaTelefono.value = data.telefono || '';
            if (empresaEmail) empresaEmail.value = data.email || '';
            if (empresaDescripcion) empresaDescripcion.value = data.descripcion || '';
            if (empresaSlogan) empresaSlogan.value = data.slogan || '';
            if (empresaLogoPreview && data.logoUrl) empresaLogoPreview.src = data.logoUrl;
            if (empresaCoverPreview && data.coverUrl) empresaCoverPreview.src = data.coverUrl;
            if (empresaFacebook) empresaFacebook.value = data.facebook || '';
            if (empresaInstagram) empresaInstagram.value = data.instagram || '';
            if (empresaWhatsapp) empresaWhatsapp.value = data.whatsapp || '';
            if (empresaWeb) empresaWeb.value = data.web || '';
            // Actualizar cabecera
            const headerNombre = document.getElementById('header-empresa-nombre');
            if (headerNombre) headerNombre.textContent = data.nombre || '';
            const headerLogo = document.getElementById('header-empresa-logo');
            if (headerLogo && data.logoUrl) headerLogo.src = data.logoUrl;
            // Si tienes un header para el slogan, también puedes actualizarlo aquí
            const headerSlogan = document.getElementById('header-empresa-slogan');
            if (headerSlogan) headerSlogan.textContent = data.slogan || '';
            const headerCurrencyBadge = document.getElementById('header-currency-badge');
            if (headerCurrencyBadge) headerCurrencyBadge.textContent = (window.defaultCurrency || 'USD');

            // --- Rellenar portada (home-view) ---
            const homeNombre = document.getElementById('home-empresa-nombre');
            if (homeNombre) homeNombre.textContent = data.nombre || '';
            const homeSlogan = document.getElementById('home-empresa-slogan');
            if (homeSlogan) homeSlogan.textContent = data.slogan || '';
            const homeDescripcion = document.getElementById('home-empresa-descripcion');
            if (homeDescripcion) homeDescripcion.textContent = data.descripcion || '';
            const homeDireccion = document.getElementById('home-empresa-direccion');
            if (homeDireccion) homeDireccion.textContent = data.direccion ? 'Dirección: ' + data.direccion : '';
            const homeTelefono = document.getElementById('home-empresa-telefono');
            if (homeTelefono) homeTelefono.textContent = data.telefono ? 'Teléfono: ' + data.telefono : '';
            const homeEmail = document.getElementById('home-empresa-email');
            if (homeEmail) homeEmail.textContent = data.email ? 'Email: ' + data.email : '';
            const homeLogo = document.getElementById('home-empresa-logo');
            if (homeLogo && data.logoUrl) homeLogo.src = data.logoUrl;
            const homeCover = document.getElementById('home-empresa-cover');
            if (homeCover && data.coverUrl) homeCover.src = data.coverUrl;
            const homeCurrencyBadge = document.getElementById('home-currency-badge');
            if (homeCurrencyBadge) homeCurrencyBadge.textContent = (window.defaultCurrency || 'USD');
            // Guardar branding para checkout
            window.empresaBranding = {
                logoUrl: data.logoUrl || '',
                siteUrl: (data.web && (data.web.startsWith('http') ? data.web : 'https://' + data.web)) || '',
                whatsappUrl: (data.whatsapp ? ('https://wa.me/' + String(data.whatsapp).replace(/[^0-9]/g, '')) : '')
            };

            // Redes sociales y web
            const homeFacebook = document.getElementById('home-empresa-facebook');
            if (homeFacebook) {
                if (data.facebook) {
                    homeFacebook.href = data.facebook.startsWith('http') ? data.facebook : 'https://facebook.com/' + data.facebook.replace(/^@/, '');
                    homeFacebook.classList.remove('hidden');
                } else {
                    homeFacebook.classList.add('hidden');
                }
            }
            const homeInstagram = document.getElementById('home-empresa-instagram');
            if (homeInstagram) {
                if (data.instagram) {
                    homeInstagram.href = data.instagram.startsWith('http') ? data.instagram : 'https://instagram.com/' + data.instagram.replace(/^@/, '');
                    homeInstagram.classList.remove('hidden');
                } else {
                    homeInstagram.classList.add('hidden');
                }
            }
            const homeWhatsapp = document.getElementById('home-empresa-whatsapp');
            if (homeWhatsapp) {
                if (data.whatsapp) {
                    let wa = data.whatsapp.replace(/[^0-9]/g, '');
                    homeWhatsapp.href = 'https://wa.me/' + wa;
                    homeWhatsapp.classList.remove('hidden');
                } else {
                    homeWhatsapp.classList.add('hidden');
                }
            }
            const homeWeb = document.getElementById('home-empresa-web');
            if (homeWeb) {
                if (data.web) {
                    homeWeb.href = data.web.startsWith('http') ? data.web : 'https://' + data.web;
                    homeWeb.classList.remove('hidden');
                } else {
                    homeWeb.classList.add('hidden');
                }
            }
        }
    } catch (e) {
        if (empresaMsg) empresaMsg.textContent = 'Error cargando perfil empresa: ' + (e.message || e.code);
    }
}

// Guardar perfil de empresa
if (empresaGuardarBtn) {
    empresaGuardarBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        let logoUrl = empresaLogoPreview ? empresaLogoPreview.src : '';
        let coverUrl = empresaCoverPreview ? empresaCoverPreview.src : '';
        // Logo
        if (empresaLogoInput && empresaLogoInput.files && empresaLogoInput.files[0]) {
            const file = empresaLogoInput.files[0];
            const reader = new FileReader();
            reader.onload = async function(evt) {
                logoUrl = evt.target.result;
                // Cover
                if (empresaCoverInput && empresaCoverInput.files && empresaCoverInput.files[0]) {
                    const coverFile = empresaCoverInput.files[0];
                    const coverReader = new FileReader();
                    coverReader.onload = async function(evt2) {
                        coverUrl = evt2.target.result;
                        await saveEmpresaProfile(logoUrl, coverUrl);
                    };
                    coverReader.readAsDataURL(coverFile);
                } else {
                    await saveEmpresaProfile(logoUrl, coverUrl);
                }
            };
            reader.readAsDataURL(file);
        } else if (empresaCoverInput && empresaCoverInput.files && empresaCoverInput.files[0]) {
            // Solo cover
            const coverFile = empresaCoverInput.files[0];
            const coverReader = new FileReader();
            coverReader.onload = async function(evt2) {
                coverUrl = evt2.target.result;
                await saveEmpresaProfile(logoUrl, coverUrl);
            };
            coverReader.readAsDataURL(coverFile);
        } else {
            await saveEmpresaProfile(logoUrl, coverUrl);
        }
    });
}

async function saveEmpresaProfile(logoUrl, coverUrl) {
    try {
        await setDoc(doc(db, 'config', 'empresa'), {
            nombre: empresaNombre ? empresaNombre.value : '',
            direccion: empresaDireccion ? empresaDireccion.value : '',
            telefono: empresaTelefono ? empresaTelefono.value : '',
            email: empresaEmail ? empresaEmail.value : '',
            descripcion: empresaDescripcion ? empresaDescripcion.value : '',
            slogan: empresaSlogan ? empresaSlogan.value : '',
            logoUrl: logoUrl || '',
            coverUrl: coverUrl || '',
            facebook: empresaFacebook ? empresaFacebook.value : '',
            instagram: empresaInstagram ? empresaInstagram.value : '',
            whatsapp: empresaWhatsapp ? empresaWhatsapp.value : '',
            web: empresaWeb ? empresaWeb.value : '',
            defaultCurrency: (empresaCurrency && empresaCurrency.value) ? empresaCurrency.value : (window.defaultCurrency || 'USD')
        }, { merge: true });
        // Actualizar estado local y UI inmediatamente
        if (empresaCurrency && empresaCurrency.value) {
            window.defaultCurrency = empresaCurrency.value;
        }
        if (empresaMsg) empresaMsg.textContent = 'Perfil de empresa guardado correctamente';
        if (empresaLogoPreview && logoUrl) empresaLogoPreview.src = logoUrl;
        if (empresaCoverPreview && coverUrl) empresaCoverPreview.src = coverUrl;
        // Refrescar badges y precios visibles
        const headerCurrencyBadge = document.getElementById('header-currency-badge');
        if (headerCurrencyBadge) headerCurrencyBadge.textContent = (window.defaultCurrency || 'USD');
        const homeCurrencyBadge = document.getElementById('home-currency-badge');
        if (homeCurrencyBadge) homeCurrencyBadge.textContent = (window.defaultCurrency || 'USD');
        renderCatalog();
        updateCartView();
    } catch (e) {
        if (empresaMsg) empresaMsg.textContent = 'Error guardando perfil empresa: ' + (e.message || e.code);
    }
}

// Previsualizar logo al seleccionar archivo
if (empresaLogoInput) {
    empresaLogoInput.addEventListener('change', (e) => {
        if (empresaLogoInput.files && empresaLogoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                if (empresaLogoPreview) empresaLogoPreview.src = evt.target.result;
            };
            reader.readAsDataURL(empresaLogoInput.files[0]);
        }
    });
}
// Previsualizar cover al seleccionar archivo
if (empresaCoverInput) {
    empresaCoverInput.addEventListener('change', (e) => {
        if (empresaCoverInput.files && empresaCoverInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                if (empresaCoverPreview) empresaCoverPreview.src = evt.target.result;
            };
            reader.readAsDataURL(empresaCoverInput.files[0]);
        }
    });
}

// Cambiar moneda por defecto en vivo (solo admins ven este selector)
if (empresaCurrency) {
    empresaCurrency.addEventListener('change', () => {
        window.defaultCurrency = empresaCurrency.value || 'USD';
        const headerCurrencyBadge = document.getElementById('header-currency-badge');
        if (headerCurrencyBadge) headerCurrencyBadge.textContent = (window.defaultCurrency || 'USD');
        const homeCurrencyBadge = document.getElementById('home-currency-badge');
        if (homeCurrencyBadge) homeCurrencyBadge.textContent = (window.defaultCurrency || 'USD');
        renderCatalog();
        updateCartView();
    });
}

// Cargar perfil empresa al iniciar
window.addEventListener('DOMContentLoaded', loadEmpresaProfile);
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const profileForm = document.getElementById('profile-form');
// Nuevos campos para registro/perfil
const regNombre = document.getElementById('register-name');
const regApellido = document.getElementById('register-surname');
const regTelefono = document.getElementById('register-phone');
const regPais = document.getElementById('register-country');
const regProvincia = document.getElementById('register-province');
const regCiudad = document.getElementById('register-city');
const regDireccion = document.getElementById('register-address');
const profNombre = document.getElementById('profile-name');
const profApellido = document.getElementById('profile-surname');
const profTelefono = document.getElementById('profile-phone');
const profPais = document.getElementById('profile-country');
const profProvincia = document.getElementById('profile-province');
const profCiudad = document.getElementById('profile-city');
const profDireccion = document.getElementById('profile-address');
const authMessage = document.getElementById('auth-message');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const logoutBtn = document.getElementById('logout-btn');

// Handler para cerrar sesión
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            // Limpiar vistas y mostrar login
            showAuthView('login');
            // Limpiar carrito
            cart = [];
            updateCartView && updateCartView();
        } catch (error) {
            alert('Error al cerrar sesión: ' + (error.message || error.code));
        }
    });
}

function showAuthView(view) {
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
    profileForm.classList.add('hidden');
    // Mostrar el área de autenticación solo si se va a mostrar un formulario
    const authViews = document.getElementById('auth-views');
    if (authViews) authViews.classList.remove('hidden');
    if (view === 'login') loginForm.classList.remove('hidden');
    if (view === 'register') registerForm.classList.remove('hidden');
    if (view === 'profile') profileForm.classList.remove('hidden');
    authMessage.textContent = '';
}

// Mostrar formularios
        // Solo declarar una vez estas variables globales
        // const headerLoginBtn = document.getElementById('header-login-btn');
        // const headerRegisterBtn = document.getElementById('header-register-btn');
        // const headerUserBtn = document.getElementById('header-user-btn');
        // const authViews = document.getElementById('auth-views');
// Registro
if (registerForm) registerForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const nombre = regNombre ? regNombre.value : '';
    const apellido = regApellido ? regApellido.value : '';
    const telefono = regTelefono ? regTelefono.value : '';
    const pais = regPais ? regPais.value : '';
    const provincia = regProvincia ? regProvincia.value : '';
    const ciudad = regCiudad ? regCiudad.value : '';
    const direccion = regDireccion ? regDireccion.value : '';
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: nombre + ' ' + apellido });
        // Guardar datos extra en Firestore
        await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
            nombre, apellido, email, telefono, pais, provincia, ciudad, direccion
        });
        showAuthView('profile');
        await fillProfileForm();
        authMessage.textContent = '';
    } catch (error) {
        let msg = '';
        switch (error.code) {
            case 'auth/email-already-in-use':
                msg = 'El correo ya está registrado.'; break;
            case 'auth/invalid-email':
                msg = 'El correo no es válido.'; break;
            case 'auth/weak-password':
                msg = 'La contraseña debe tener al menos 6 caracteres.'; break;
            default:
                msg = 'Error al registrarse: ' + (error.message || error.code);
        }
        authMessage.textContent = msg;
        authMessage.classList.remove('hidden');
        authMessage.style.display = 'block';
        showAuthView('register');
        // Fallback: mostrar alerta si el mensaje no es visible
        setTimeout(() => {
            if (!authMessage.offsetParent || authMessage.offsetHeight === 0) {
                alert(msg);
            }
        }, 200);
    }
};

// Login
if (loginForm) loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showAuthView('profile');
        fillProfileForm();
        authMessage.textContent = '';
    } catch (error) {
        let msg = '';
        switch (error.code) {
            case 'auth/user-not-found':
                msg = 'No existe una cuenta con ese correo.'; break;
            case 'auth/wrong-password':
                msg = 'Contraseña incorrecta.'; break;
            case 'auth/invalid-email':
                msg = 'El correo no es válido.'; break;
            default:
                msg = 'Error al iniciar sesión: ' + (error.message || error.code);
        }
        authMessage.textContent = msg;
        authMessage.classList.remove('hidden');
        authMessage.style.display = 'block';
        // Asegurarse de que el formulario de login siga visible
        showAuthView('login');
        // Fallback: mostrar alerta si el mensaje no es visible
        setTimeout(() => {
            if (!authMessage.offsetParent || authMessage.offsetHeight === 0) {
                alert(msg);
            }
        }, 200);
    }
};

// Actualizar perfil
if (profileForm) profileForm.onsubmit = async (e) => {
    e.preventDefault();
    const nombre = profNombre ? profNombre.value : '';
    const apellido = profApellido ? profApellido.value : '';
    const telefono = profTelefono ? profTelefono.value : '';
    const pais = profPais ? profPais.value : '';
    const provincia = profProvincia ? profProvincia.value : '';
    const ciudad = profCiudad ? profCiudad.value : '';
    const direccion = profDireccion ? profDireccion.value : '';
    try {
        await updateProfile(auth.currentUser, { displayName: nombre + ' ' + apellido });
        await setDoc(doc(db, 'usuarios', auth.currentUser.uid), {
            nombre, apellido, telefono, pais, provincia, ciudad, direccion
        }, { merge: true });
        authMessage.textContent = 'Perfil actualizado';
    } catch (error) {
        authMessage.textContent = error.message;
    }
};

async function fillProfileForm() {
    if (!auth.currentUser) return;
    // Leer datos de Firestore
    const userDoc = await getDocFromServer(doc(db, 'usuarios', auth.currentUser.uid));
    console.log('[DEBUG] Firestore userDoc.exists:', userDoc.exists());
    const profMsg = document.getElementById('auth-message');
    if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('[DEBUG] Firestore userDoc.data:', data);
        let emptyFields = [];
        if (profNombre) { profNombre.value = data.nombre || ''; if (!data.nombre) emptyFields.push('nombre'); }
        if (profApellido) { profApellido.value = data.apellido || ''; if (!data.apellido) emptyFields.push('apellido'); }
        if (profTelefono) { profTelefono.value = data.telefono || ''; if (!data.telefono) emptyFields.push('teléfono'); }
        if (profPais) { profPais.value = data.pais || ''; if (!data.pais) emptyFields.push('país'); }
        if (profProvincia) { profProvincia.value = data.provincia || ''; if (!data.provincia) emptyFields.push('provincia'); }
        if (profCiudad) { profCiudad.value = data.ciudad || ''; if (!data.ciudad) emptyFields.push('ciudad'); }
        if (profDireccion) { profDireccion.value = data.direccion || ''; if (!data.direccion) emptyFields.push('dirección'); }
        // Email solo lectura
        const profEmail = document.getElementById('profile-email');
        if (profEmail) profEmail.value = auth.currentUser.email || '';
        if (profMsg) {
            if (emptyFields.length > 0) {
                profMsg.textContent = 'Faltan datos en tu perfil: ' + emptyFields.join(', ');
                profMsg.classList.remove('hidden');
            } else {
                profMsg.textContent = '';
                profMsg.classList.add('hidden');
            }
        }
    } else {
        console.log('[DEBUG] No existe documento de usuario en Firestore para UID:', auth.currentUser.uid);
        if (profMsg) {
            profMsg.textContent = 'No existe información de perfil en la base de datos. Actualiza tu perfil para guardar tus datos.';
            profMsg.classList.remove('hidden');
        }
        if (profNombre) profNombre.value = '';
        if (profApellido) profApellido.value = '';
        if (profTelefono) profTelefono.value = '';
        if (profPais) profPais.value = '';
        if (profProvincia) profProvincia.value = '';
        if (profCiudad) profCiudad.value = '';
        if (profDireccion) profDireccion.value = '';
        const profEmail = document.getElementById('profile-email');
        if (profEmail) profEmail.value = auth.currentUser.email || '';
    }
}

// Estado de autenticación y control de header
onAuthStateChanged(auth, (user) => {
    const authViews = document.getElementById('auth-views');
    const headerLoginBtn = document.getElementById('header-login-btn');
    const headerRegisterBtn = document.getElementById('header-register-btn');
    const headerUserBtn = document.getElementById('header-user-btn');
    const headerUserAvatar = document.getElementById('header-user-avatar');
    const headerUserInitials = document.getElementById('header-user-initials');
    if (user) {
        // Ocultar botones de login/registro, mostrar avatar
        if (headerLoginBtn) headerLoginBtn.classList.add('hidden');
        if (headerRegisterBtn) headerRegisterBtn.classList.add('hidden');
        if (headerUserBtn) headerUserBtn.classList.remove('hidden');
        // Mostrar iniciales o foto
            if (headerUserAvatar && headerUserInitials) {
            if (user.photoURL) {
                headerUserAvatar.src = user.photoURL;
                headerUserAvatar.classList.remove('hidden');
                headerUserInitials.textContent = '';
            } else {
                headerUserAvatar.src = 'assets/images/favicon.png';
                headerUserAvatar.classList.add('hidden');
                // Iniciales del nombre
                const name = user.displayName || user.email || '';
                const initials = name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
                headerUserInitials.textContent = initials;
            }
        }
        // Ocultar authViews por defecto
        if (authViews) authViews.classList.add('hidden');
        // Cargar carrito persistente (esperar a que termine antes de continuar)
        loadCartFromFirestore().then(() => {
            updateCartView();
        });
    } else {
        // Mostrar botones de login/registro, ocultar avatar
        if (headerLoginBtn) headerLoginBtn.classList.remove('hidden');
        if (headerRegisterBtn) headerRegisterBtn.classList.remove('hidden');
        if (headerUserBtn) headerUserBtn.classList.add('hidden');
        // Ocultar authViews por defecto
        if (authViews) authViews.classList.add('hidden');
        // Limpiar carrito si se desloguea
        cart = [];
        updateCartView();
    }
    // Eliminadas declaraciones duplicadas de headerRegisterBtn, headerUserBtn y authViews
    if (headerLoginBtn) headerLoginBtn.onclick = (e) => {
        e.preventDefault();
        if (authViews) authViews.classList.remove('hidden');
        showAuthView('login');
    };
    if (headerRegisterBtn) headerRegisterBtn.onclick = (e) => {
        e.preventDefault();
        if (authViews) authViews.classList.remove('hidden');
        showAuthView('register');
    };
    if (headerUserBtn) headerUserBtn.onclick = async (e) => {
        e.preventDefault();
        if (authViews) authViews.classList.remove('hidden');
        showAuthView('profile');
        await fillProfileForm();
    };
});

// Ya no forzamos mostrar login al cargar la página. Solo se muestra cuando el usuario lo solicita o es requerido.

// js/main.js
// --- CONSTANTES Y CONFIGURACIÓN ---
// Estas variables son necesarias para la ejecución en el entorno Canvas.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=`;
const API_KEY = "";
const SHIPPING_COST = 5.00;
let defaultCurrency = 'USD';
function formatCurrency(amount, currency) {
    try {
        return new Intl.NumberFormat('es-UY', { style: 'currency', currency: currency || defaultCurrency }).format(Number(amount || 0));
    } catch (e) {
        return `${Number(amount || 0).toFixed(2)} ${currency || defaultCurrency}`;
    }
}

// --- BLOQUE DE DATOS (Simula /data/catalog.js) ---
// Idealmente, esto se cargaría desde una API o un archivo JSON en un proyecto real.


// Estado Global del Carrito
let cart = [];
// Estado global del catálogo
let catalog = [];
// Guardar carrito en Firestore
async function saveCartToFirestore() {
    if (auth.currentUser) {
        try {
            console.log('[Carrito] Guardando en Firestore:', cart);
            await setDoc(doc(db, 'usuarios', auth.currentUser.uid), { carrito: cart }, { merge: true });
        } catch (e) {
            console.error('[Carrito] Error guardando en Firestore:', e);
        }
    } else {
        console.log('[Carrito] No hay usuario autenticado, no se guarda en Firestore');
    }
}

// Cargar carrito desde Firestore
async function loadCartFromFirestore() {
    if (auth.currentUser) {
        try {
            const userDoc = await getDocFromServer(doc(db, 'usuarios', auth.currentUser.uid));
            if (userDoc.exists() && userDoc.data().carrito) {
                cart = userDoc.data().carrito;
                console.log('[Carrito] Cargado de Firestore:', cart);
            } else {
                cart = [];
                console.log('[Carrito] No hay carrito guardado en Firestore.');
            }
            updateCartView();
        } catch (e) {
            console.error('[Carrito] Error cargando de Firestore:', e);
        }
    } else {
        console.log('[Carrito] No hay usuario autenticado, no se carga de Firestore');
    }
}

// --- BLOQUE DE LÓGICA (Simula /js/main.js) ---

// Referencias a elementos del DOM
const cartItemsContainer = document.getElementById('cart-items');
const emptyCartMessage = document.getElementById('empty-cart-message');
const productCatalogContainer = document.getElementById('product-catalog');
const subtotalElement = document.getElementById('subtotal');
const shippingCostElement = document.getElementById('shipping-cost');
const totalElement = document.getElementById('total');
const finalTotalButtonSpan = document.getElementById('final-total');
const checkoutForm = document.getElementById('checkout-form');
const messageArea = document.getElementById('message-area');
const submitButton = document.getElementById('submit-button');
const clearCartButton = document.getElementById('clear-cart-btn');
const cartCountBadge = document.getElementById('cart-count');

// Referencias al Modal
const productModal = document.getElementById('product-modal');
const mainImage = document.getElementById('main-product-image');
const thumbnailGallery = document.getElementById('thumbnail-gallery');
const modalProductName = document.getElementById('modal-product-name');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductStock = document.getElementById('modal-product-stock');
const modalAddToCartBtn = document.getElementById('modal-add-to-cart-btn');

// Función para cambiar de vista (Home, Catalog, Checkout)
function navigate(viewId) {
    document.querySelectorAll('.page-view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`${viewId}-view`).classList.add('active');
    // Ocultar área de autenticación y todos los formularios
    const authViews = document.getElementById('auth-views');
    if (authViews) authViews.classList.add('hidden');
    if (loginForm) loginForm.classList.add('hidden');
    if (registerForm) registerForm.classList.add('hidden');
    if (profileForm) profileForm.classList.add('hidden');
    // Autocompletar datos de usuario en el checkout si corresponde
    if (viewId === 'checkout' && auth.currentUser) {
        (async () => {
            try {
                const userDoc = await getDocFromServer(doc(db, 'usuarios', auth.currentUser.uid));
                let data = userDoc.exists() ? userDoc.data() : {};
            const checkoutName = document.getElementById('nombre');
            const checkoutApellido = document.getElementById('apellido');
            const checkoutEmail = document.getElementById('email');
            const checkoutTelefono = document.getElementById('telefono');
            const checkoutPais = document.getElementById('pais');
            const checkoutProvincia = document.getElementById('provincia');
            const checkoutCiudad = document.getElementById('ciudad');
            const checkoutDireccion = document.getElementById('direccion');
            if (checkoutName) checkoutName.value = data.nombre || '';
            if (checkoutApellido) checkoutApellido.value = data.apellido || '';
            if (checkoutEmail) checkoutEmail.value = auth.currentUser.email || '';
            if (checkoutTelefono) checkoutTelefono.value = data.telefono || '';
            if (checkoutPais) checkoutPais.value = data.pais || '';
            if (checkoutProvincia) checkoutProvincia.value = data.provincia || '';
            if (checkoutCiudad) checkoutCiudad.value = data.ciudad || '';
            if (checkoutDireccion) checkoutDireccion.value = data.direccion || '';
            } catch (e) {
                console.warn('[Checkout autofill] No se pudo leer perfil de usuario:', e);
            }
        })();
    }
    hideProductModal();
    window.scrollTo(0, 0); 
}
    // Hacer navigate global para que funcione con type="module"
    window.navigate = navigate;
// Hacer navigate global para que funcione con type="module"
window.navigate = navigate;

// Función para renderizar el catálogo de productos
function renderCatalog() {
    productCatalogContainer.innerHTML = '';
    catalog.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.className = 'bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden flex flex-col';
        // Buscar si el producto ya está en el carrito
        const cartItem = cart.find(item => item.id === product.id);
        const cantidadEnCarrito = cartItem ? cartItem.cantidad : 0;
        productDiv.innerHTML = `
            <div class="h-48 w-full overflow-hidden bg-gray-100 cursor-pointer" onclick="showProductModal('${product.id}')">
                <img src="${product.imagenes[0] || 'assets/images/favicon.png'}" alt="${product.nombre}" class="w-full h-full object-contain bg-white p-2 transition duration-500">
            </div>
            <div class="p-4 flex-grow flex flex-col justify-between">
                <div>
                    <h3 class="font-bold text-lg text-gray-900 mb-1">${product.nombre}</h3>
                    <p class="text-2xl font-extrabold text-indigo-600 mb-3">${formatCurrency(product.precio, (window.defaultCurrency || defaultCurrency))}</p>
                    ${typeof product.stock === 'number' ? `<p class="text-xs font-medium text-gray-600 mb-2">Stock: <span class="inline-block px-2 py-0.5 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}">${product.stock}</span></p>` : ''}
                </div>
                <div class="mt-4 flex flex-col space-y-2 relative">
                    <button data-id="${product.id}" class="view-details-btn w-full text-sm font-semibold px-4 py-2 rounded-lg text-indigo-600 border border-indigo-600 hover:bg-indigo-50 transition duration-150">
                        Ver Detalles (Fotos/Medidas)
                    </button>
                    <div class="relative">
                        <button data-id="${product.id}" class="add-to-cart-btn w-full ${Number(product.stock) > 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'} text-white font-bold py-2 px-4 rounded-lg transition duration-150 shadow-md flex items-center justify-center" ${Number(product.stock) <= 0 ? 'disabled' : ''}>
                            ${Number(product.stock) <= 0 ? 'Sin stock' : 'Añadir al Carrito'}
                            <span class="ml-2 inline-block rounded-full bg-white text-green-700 font-bold px-2 py-0.5 text-xs border border-green-500 ${cantidadEnCarrito > 0 ? '' : 'hidden'}" id="cart-count-indicator-${product.id}">
                                ${cantidadEnCarrito > 0 ? cantidadEnCarrito : ''}
                            </span>
                        </button>
                        <span class="added-feedback absolute left-1/2 -translate-x-1/2 top-0 mt-[-2.2rem] bg-green-500 text-white text-xs font-bold px-3 py-1 rounded shadow-lg opacity-0 pointer-events-none transition-opacity duration-300 z-50" style="display:none;">¡Agregado!</span>
                    </div>
                </div>
            </div>
        `;
        productCatalogContainer.appendChild(productDiv);
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.dataset.id;
            addToCart(productId);
            // Feedback visual inmediato
            const parent = button.parentElement;
            const feedback = parent.querySelector('.added-feedback');
            if (feedback) {
                feedback.style.display = 'block';
                feedback.style.opacity = '1';
                setTimeout(() => {
                    feedback.style.opacity = '0';
                    setTimeout(() => { feedback.style.display = 'none'; }, 300);
                }, 900);
            }
            // Actualizar contador junto al botón
            const cartItem = cart.find(item => item.id === productId);
            const countSpan = parent.querySelector(`#cart-count-indicator-${productId}`);
            if (countSpan) {
                if (cartItem && cartItem.cantidad > 0) {
                    countSpan.textContent = cartItem.cantidad;
                    countSpan.classList.remove('hidden');
                } else {
                    countSpan.textContent = '';
                    countSpan.classList.add('hidden');
                }
            }
        });
    });
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (e) => showProductModal(e.target.dataset.id));
    });
}

// Función para actualizar la vista del carrito y los totales
function updateCartView() {
    cartItemsContainer.innerHTML = '';
    let subtotal = 0;
    let totalItems = 0;

    if (cart.length === 0) {
        emptyCartMessage.classList.remove('hidden');
        submitButton.disabled = true;
    } else {
        emptyCartMessage.classList.add('hidden');
        submitButton.disabled = false;
    }

    cart.forEach(item => {
        const product = catalog.find(p => p.id === item.id);
        if (!product) return; // Ignora productos huérfanos
        const itemTotal = product.precio * item.cantidad;
        subtotal += itemTotal;
        totalItems += item.cantidad;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'flex justify-between items-center bg-gray-50 p-3 rounded-lg border';
        itemDiv.innerHTML = `
            <div class="flex-1">
                <p class="font-medium text-gray-800">${product.nombre}</p>
                <p class="text-sm text-gray-500">${formatCurrency(product.precio, (window.defaultCurrency || defaultCurrency))} c/u</p>
            </div>
            <div class="flex items-center space-x-2">
                <button data-id="${item.id}" data-action="decrease" class="update-quantity-btn w-6 h-6 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition">-</button>
                <span class="font-bold text-gray-800 w-4 text-center">${item.cantidad}</span>
                <button data-id="${item.id}" data-action="increase" class="update-quantity-btn w-6 h-6 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition">+</button>
            </div>
        `;
        cartItemsContainer.appendChild(itemDiv);
    });

    // Actualizar resumen de totales
    const total = subtotal + (cart.length > 0 ? SHIPPING_COST : 0);
    subtotalElement.textContent = formatCurrency(subtotal, defaultCurrency);
    shippingCostElement.textContent = formatCurrency((cart.length > 0 ? SHIPPING_COST : 0), defaultCurrency);
    totalElement.textContent = formatCurrency(total, defaultCurrency);
    finalTotalButtonSpan.textContent = formatCurrency(total, defaultCurrency);
    cartCountBadge.textContent = totalItems.toString();

    document.querySelectorAll('.update-quantity-btn').forEach(button => {
        button.addEventListener('click', handleQuantityChange);
    });

    // Refrescar catálogo para actualizar los contadores de productos
    renderCatalog();
}

function addToCart(productId) {
    // Si el usuario no está autenticado, mostrar login y salir
    if (!auth.currentUser) {
        const authViews = document.getElementById('auth-views');
        if (authViews) authViews.classList.remove('hidden');
        showAuthView('login');
        showMessage('Debes iniciar sesión para agregar productos al carrito.', 'info');
        return;
    }
    // Validar stock disponible antes de añadir
    const prod = catalog.find(p => p.id === productId);
    if (prod && Number(prod.stock) <= 0) {
        showMessage('Este producto no tiene stock disponible.', 'error');
        return;
    }
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.cantidad += 1;
    } else {
        cart.push({ id: productId, cantidad: 1 });
    }
    updateCartView();
    saveCartToFirestore();
    showMessage(`Se ha añadido ${catalog.find(p => p.id === productId).nombre} al carrito.`, 'info');
}

function handleQuantityChange(e) {
    const productId = e.target.dataset.id;
    const action = e.target.dataset.action;
    const itemIndex = cart.findIndex(item => item.id === productId);

    if (itemIndex > -1) {
        if (action === 'increase') {
            cart[itemIndex].cantidad += 1;
        } else if (action === 'decrease') {
            cart[itemIndex].cantidad -= 1;
            if (cart[itemIndex].cantidad <= 0) {
                cart.splice(itemIndex, 1); 
            }
        }
        updateCartView();
        saveCartToFirestore();
    }
}

clearCartButton.addEventListener('click', () => {
    cart = [];
    updateCartView();
    saveCartToFirestore();
    showMessage('El carrito ha sido vaciado.', 'info');
});

// --- LÓGICA DEL MODAL DE DETALLES ---
function showProductModal(productId) {
    const product = catalog.find(p => p.id === productId);
    if (!product) return;

    // Rellenar detalles textuales
    modalProductName.textContent = product.nombre;
    // Permitir HTML en la descripción y agregar título
    modalProductDescription.innerHTML = product.descripcionCompleta;
    modalProductPrice.textContent = formatCurrency(product.precio, (window.defaultCurrency || defaultCurrency));
    modalProductStock.textContent = typeof product.stock === 'number' ? product.stock : '-';

    // Configurar la imagen principal
    mainImage.src = product.imagenes[0];
    mainImage.alt = product.nombre + ' - Vista Principal';
    mainImage.classList.remove('object-cover');
    mainImage.classList.add('object-contain', 'bg-white', 'p-2');
    
    // Crear galería de miniaturas
    thumbnailGallery.innerHTML = '';
    product.imagenes.forEach((imageUrl, index) => {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `Perspectiva ${index + 1}`;
        img.className = 'w-full h-full object-contain bg-white p-1 rounded-md cursor-pointer border-2 border-transparent hover:border-green-600 transition duration-150';
        img.onclick = () => {
            mainImage.src = imageUrl;
            document.querySelectorAll('#thumbnail-gallery img').forEach(i => i.classList.remove('border-green-600'));
            img.classList.add('border-green-600');
        };
        const thumbWrapper = document.createElement('div');
        thumbWrapper.className = 'aspect-square';
        thumbWrapper.appendChild(img);
        thumbnailGallery.appendChild(thumbWrapper);
    });
    if (thumbnailGallery.firstChild && thumbnailGallery.firstChild.firstChild) {
        thumbnailGallery.firstChild.firstChild.classList.add('border-indigo-500');
    }

    // Configurar el botón Añadir al Carrito del modal
    modalAddToCartBtn.onclick = () => {
        addToCart(productId);
        hideProductModal();
    };

    // Mostrar el modal
    productModal.classList.add('active');
}

// Hacer la función accesible globalmente para el onclick del HTML
window.showProductModal = showProductModal;

function hideProductModal() {
    productModal.classList.remove('active');
}

productModal.addEventListener('click', (e) => {
    if (e.target.id === 'product-modal') {
        hideProductModal();
    }
});


// --- LÓGICA DE SIMULACIÓN DE API (Generación de Texto con Gemini) ---

/**
 * Simula la función que busca y guarda los datos del cliente.
 */
async function guardarDatosCliente(formData) {
    // Este es el punto de integración con Firestore (próximo paso).
    console.log('Simulando guardado de datos del cliente:', formData);
    await new Promise(resolve => setTimeout(resolve, 500)); 
    return formData;
}

/**
 * Simula la función para generar y enviar la notificación de pedido usando Gemini API.
 */
async function enviarNotificacionPedido(cliente, detallesPedido, total) {
    const itemsList = detallesPedido.map(item => {
        const product = catalog.find(p => p.id === item.id);
        return `${item.cantidad} x ${product.nombre} (US$${(product.precio * item.cantidad).toFixed(2)})`;
    }).join('\n');

    const userPrompt = `Genera un mensaje de confirmación de pedido. El cliente se llama ${cliente.nombre} ${cliente.apellido} y el pedido total es de US$${total}. Los productos son:\n${itemsList}\nEl mensaje debe ser amable, formal y confirmar que el pedido será enviado a la dirección ${cliente.direccion}.`;

    for (let i = 0; i < 3; i++) {
        try {
            const payload = {
                contents: [{ parts: [{ text: userPrompt }] }],
            };
            
            const response = await fetch(GEMINI_API_URL + API_KEY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.status === 429 && i < 2) {
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar el mensaje de confirmación.";

        } catch (error) {
            if (i === 2) {
                console.error("Error fatal al generar la notificación con Gemini:", error);
                throw new Error("Error de API.");
            }
        }
    }
}

// --- MANEJO DEL ENVÍO DEL FORMULARIO ---

import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';
const functionsInstance = getFunctions(app);
// Conectar a emulador de Functions en local
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    try {
        // Puerto configurado en firebase.json para Functions: 5003
        // Usa localhost para evitar problemas de loopback en algunos entornos
        connectFunctionsEmulator(functionsInstance, '127.0.0.1', 5003);
    } catch (e) {
        console.warn('No se pudo conectar al emulador de Functions:', e);
    }
}

checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
        showMessage('Por favor, añade al menos un producto al carrito.', 'error');
        return;
    }

    submitButton.disabled = true;
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Procesando...';
    showMessage('Procesando tu pedido, espera un momento...', 'loading');

    const formData = new FormData(checkoutForm);
    const clientData = Object.fromEntries(formData.entries());
    // Persistir cambios del cliente en su perfil antes de continuar
    try {
        if (auth.currentUser) {
            await setDoc(doc(db, 'usuarios', auth.currentUser.uid), {
                nombre: clientData.nombre || '',
                apellido: clientData.apellido || '',
                telefono: clientData.telefono || '',
                pais: clientData.pais || '',
                provincia: clientData.provincia || '',
                ciudad: clientData.ciudad || '',
                direccion: clientData.direccion || ''
            }, { merge: true });
        }
    } catch (persistErr) {
        console.warn('[Checkout] No se pudo guardar datos de cliente:', persistErr);
    }
    const total = cart.reduce((acc, item) => {
        const prod = catalog.find(p => p.id === item.id);
        return acc + (prod ? (prod.precio * item.cantidad) : 0);
    }, 0) + (cart.length > 0 ? SHIPPING_COST : 0);

    // Obtener datos de empresa desde Firestore
    let empresaEmail = 'ventas@begam.uy';
    let empresaNombre = 'BegamShop';
    let moneda = defaultCurrency || 'USD';
    let logoUrl = '';
    let siteUrl = '';
    let whatsappUrl = '';
    try {
        const empresaDoc = await getDocFromServer(doc(db, 'config', 'empresa'));
        if (empresaDoc.exists()) {
            const empresaData = empresaDoc.data();
            empresaEmail = empresaData.email || empresaEmail;
            empresaNombre = empresaData.nombre || empresaNombre;
            moneda = empresaData.defaultCurrency || moneda;
            logoUrl = empresaData.logoUrl || '';
            siteUrl = (empresaData.web && (empresaData.web.startsWith('http') ? empresaData.web : 'https://' + empresaData.web)) || '';
            whatsappUrl = (empresaData.whatsapp ? ('https://wa.me/' + String(empresaData.whatsapp).replace(/[^0-9]/g, '')) : '');
        }
    } catch (err) {
        console.warn('No se pudo obtener datos de empresa, usando valores por defecto.');
    }

    // Preparar datos del pedido
    const orderId = Date.now().toString();
    const timestamp = new Date().toISOString();
    
    // Validación: catálogo cargado antes de continuar
    if (!Array.isArray(catalog) || catalog.length === 0) {
        showMessage('El catálogo aún no está cargado. Intenta nuevamente en unos segundos.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return;
    }

    // Validación mínima: existencia de productos. La verificación de stock se delega a reserveStock.
    const invalids = cart.filter(item => {
        const prod = catalog.find(p => p.id === item.id);
        const hasFallback = item && (typeof item.precio === 'number' || item.nombre);
        if (!prod && !hasFallback) return true; // no disponible
        return false;
    });
    if (invalids.length > 0) {
        showMessage('Algunos productos ya no están disponibles. Revisa el carrito.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return;
    }
    const items = cart.map(item => {
        const prod = catalog.find(p => p.id === item.id);
        const nombre = prod?.nombre || item.nombre || 'Producto';
        const precio = typeof prod?.precio === 'number' ? prod.precio : (typeof item.precio === 'number' ? item.precio : 0);
        const cantidad = typeof item.cantidad === 'number' ? item.cantidad : 1;
        return {
            nombre: nombre,
            cantidad: cantidad,
            precioUnitario: precio,
            totalProducto: precio * cantidad
        };
    });

    // Reservar stock transaccionalmente antes de enviar correo
    const reserveStock = httpsCallable(functionsInstance, 'reserveStock');
    let reservationIdRef = null;
    try {
        showMessage('Reservando stock...', 'loading');
        const reservationRes = await reserveStock({
            items: cart.map(ci => ({ id: ci.id, cantidad: ci.cantidad }))
        });
        const reservation = reservationRes?.data || {};
        console.log('[Checkout] Resultado reserveStock:', reservation);
        if (!reservation.ok) {
            const errMsg = reservation.error || 'No se pudo reservar stock. Ajusta cantidades o intenta más tarde.';
            showMessage(errMsg, 'error');
            return;
        }
        reservationIdRef = reservation.reservationId || null;

        // Llamar a la función de Firebase para enviar correo
        const sendOrderEmail = httpsCallable(functionsInstance, 'sendOrderEmail');
        console.log('[Checkout] Invocando sendOrderEmail con payload:', {
            orderId,
            timestamp,
            email: clientData.email,
            nombre: clientData.nombre,
            telefono: clientData.telefono,
            items,
            total,
            empresaEmail,
            empresaNombre,
            moneda,
            logoUrl,
            siteUrl,
            whatsappUrl
        });
        console.log('[Checkout] Llamando a sendOrderEmail...');
        const resp = await sendOrderEmail({
            orderId,
            timestamp,
            email: clientData.email,
            nombre: clientData.nombre,
            telefono: clientData.telefono,
            items,
            total,
            empresaEmail,
            empresaNombre,
            moneda,
            reservationId: reservation.reservationId
        });
        console.log('[Checkout] Respuesta sendOrderEmail:', resp);
        const emailData = (resp && resp.data) ? resp.data : {};
        const sgReady = !!emailData.sendgridReady;
        const adminOk = !!emailData.adminEmailSent;
        const clientOk = !!emailData.clientEmailSent;
        const returnedOrderId = emailData.orderId || orderId;
        let successMsg = `¡Pedido confirmado! ID: ${returnedOrderId}`;
        if (!sgReady) {
            successMsg += ' Envío de correos deshabilitado (SendGrid no configurado).';
        } else if (adminOk && clientOk) {
            successMsg += ' Correos enviados a cliente y administrador.';
        } else {
            const adminTxt = adminOk ? 'enviado' : 'falló';
            const clientTxt = clientOk ? 'enviado' : 'falló';
            successMsg += ` Email admin: ${adminTxt}. Email cliente: ${clientTxt}.`;
        }
        showMessage(successMsg, 'success', 10000);
        try {
            if (navigator && navigator.clipboard && returnedOrderId) {
                await navigator.clipboard.writeText(String(returnedOrderId));
                showMessage('ID de pedido copiado al portapapeles.', 'info', 4000);
            }
        } catch (_) {}
        // Renderizar pantalla de confirmación con resumen
        try {
            const confirmIdEl = document.getElementById('confirm-order-id');
            const confirmSummaryEl = document.getElementById('confirm-summary');
            if (confirmIdEl) confirmIdEl.textContent = String(returnedOrderId);
            if (confirmSummaryEl) {
                const totalFmt = formatCurrency(total, (window.defaultCurrency || defaultCurrency));
                confirmSummaryEl.innerHTML = `
                    <p class="text-gray-800"><strong>Cliente:</strong> ${clientData.nombre || ''} ${clientData.apellido || ''}</p>
                    <p class="text-gray-800"><strong>Email:</strong> ${clientData.email || ''}</p>
                    <p class="text-gray-800"><strong>Teléfono:</strong> ${clientData.telefono || ''}</p>
                    <p class="text-gray-800"><strong>Total:</strong> ${totalFmt}</p>
                    <div class="mt-3">
                        <p class="font-semibold text-gray-700 mb-2">Productos:</p>
                        <ul class="list-disc pl-5 text-gray-700">
                            ${items.map(i => `<li>${i.cantidad} x ${i.nombre} — ${formatCurrency(i.totalProducto, (window.defaultCurrency || defaultCurrency))}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
        } catch {}
        cart = [];
        updateCartView();
        saveCartToFirestore();
        checkoutForm.reset();
        navigate('confirmation');
    } catch (error) {
        console.error('Error en checkout (reserva/correo):', error);
        // Intentar liberar stock si hubo reserva previa
        try {
            const releaseStock = httpsCallable(functionsInstance, 'releaseStock');
            await releaseStock({ reservationId: reservationIdRef || error?.details?.reservationId || null });
        } catch {}
        const code = error?.code || 'unknown';
        const msg = error?.message || 'Error desconocido';
        const details = error?.details ? JSON.stringify(error.details) : '';
        showMessage('Error al enviar el pedido por email: ' + msg + ' (' + code + ')', 'error');
        console.warn('[Checkout] Detalles error callable:', details);
    } finally {
        setTimeout(() => {
            submitButton.textContent = originalButtonText;
            submitButton.disabled = cart.length === 0;
            updateCartView();
        }, 1500);
    }
});

// Función para mostrar mensajes
let messageTimeout;
function showMessage(message, type, duration = 5000) {
    clearTimeout(messageTimeout);
    // Toast liviano: posición fija arriba-derecha
    messageArea.className = 'fixed top-4 right-4 z-50 min-w-[240px] shadow-lg rounded-lg px-4 py-3 text-sm';
    messageArea.textContent = message;

    if (type === 'success') {
        messageArea.classList.add('bg-green-600', 'text-white');
    } else if (type === 'error') {
        messageArea.classList.add('bg-red-600', 'text-white');
    } else if (type === 'loading') {
        messageArea.classList.add('bg-blue-600', 'text-white');
    } else if (type === 'info') {
        messageArea.classList.add('bg-yellow-500', 'text-gray-900');
    }
    messageTimeout = setTimeout(() => {
        messageArea.classList.add('hidden');
    }, duration);
    messageArea.classList.remove('hidden');
}

// Inicialización de la aplicación
// Cargar catálogo desde Firestore y luego inicializar la app
async function loadCatalogFromFirestore() {
    catalog = [];
    try {
        const querySnapshot = await getDocsFromServer(collection(db, 'catalog'));
        const tmp = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data() || {};
            // Precio del catálogo: usar preferentemente "PRECIO"; durante migración aceptar variantes.
            // Normalizar para formatos como "US$ 1.234,56", "$1,234.56", "1234,56" o números.
            const rawPrice = (
                data["PRECIO"] ??
                data.precio ??
                data.price ??
                data["PRECIO (USD)"] ??
                data["PRECIO_USD"] ??
                0
            );
            const explicitPrice = normalizePrice(rawPrice);
            // Moneda: tomar de la configuración de empresa cargada previamente (window.defaultCurrency)
            const currency = (window.defaultCurrency || defaultCurrency);

            const nombre = data["NOMBRE_PRODUCTO"] || data.nombre || '';
            const sku = data["CODIGO_SKU"] || data.sku || '';
            const codigo = data["CODIGO"] || data.codigo || sku || '';

            // Imágenes: aceptar múltiples variantes y filtrar vacíos
            const imgs = [
                data["IMG1"] || data["img1"] || data["Imagen1"] || data["imagen1"] || '',
                data["IMG2"] || data["img2"] || data["Imagen2"] || data["imagen2"] || '',
                data["IMG3"] || data["img3"] || data["Imagen3"] || data["imagen3"] || ''
            ].filter(url => !!url);

            tmp.push({
                id: docSnap.id,
                nombre,
                precio: explicitPrice,
                currency,
                stock: (() => {
                    const raw = data["STOCK_DISPONIBLE"] ?? data.stock;
                    const n = Number(raw);
                    return Number.isFinite(n) ? n : undefined;
                })(),
                descripcionCompleta: data["DESCRIPCION"] || data.descripcionCompleta || '',
                imagenes: imgs,
                sku,
                categoria: data["CATEGORIA"] || data.categoria || '',
                marca: data["MARCA"] || data.marca || '',
                color: data["COLOR"] || data.color || '',
                tamano: data["TAMAÑO"] || data.tamano || '',
                codigo
            });
        });

        // Deduplicar por "codigo" (o por id si no hay codigo) y fusionar datos.
        // Regla: preferir documento con precio > 0; combinar imágenes y otros campos.
        const byCode = new Map();
        for (const p of tmp) {
            const key = (p.codigo && String(p.codigo).trim()) || p.sku || p.id;
            const existing = byCode.get(key);
            if (!existing) {
                byCode.set(key, { ...p });
            } else {
                const chosen = { ...existing };
                // Preferir precio válido
                const priceExisting = typeof existing.precio === 'number' ? existing.precio : 0;
                const priceNew = typeof p.precio === 'number' ? p.precio : 0;
                if (priceNew > 0 && priceExisting <= 0) {
                    chosen.precio = p.precio;
                    chosen.currency = p.currency || chosen.currency;
                }
                // Combinar imágenes (únicas, manteniendo orden)
                const imgs = Array.from(new Set([...(existing.imagenes || []), ...(p.imagenes || [])])).filter(Boolean);
                chosen.imagenes = imgs.length ? imgs : (existing.imagenes || p.imagenes || []);
                // Completar nombre/descripcion si faltan
                chosen.nombre = existing.nombre || p.nombre || '';
                chosen.descripcionCompleta = existing.descripcionCompleta || p.descripcionCompleta || '';
                chosen.marca = existing.marca || p.marca || '';
                chosen.categoria = existing.categoria || p.categoria || '';
                chosen.color = existing.color || p.color || '';
                chosen.tamano = existing.tamano || p.tamano || '';
                // Mantener un id estable (preferir el primero)
                chosen.id = existing.id;
                byCode.set(key, chosen);
            }
        }
        catalog = Array.from(byCode.values());
        // Fallback: si no hay docs, usar mock/local
        if (!Array.isArray(catalog) || catalog.length === 0) {
            console.warn('[Catálogo] Firestore vacío o inaccesible. Usando catálogo mock/local.');
            catalog = (typeof window !== 'undefined' && Array.isArray(window.catalog) && window.catalog.length)
                ? window.catalog
                : (Array.isArray(mockCatalog) ? mockCatalog : []);
        }
    } catch (e) {
        console.error('Error cargando catálogo de Firestore:', e);
        // Fallback inmediato en error de red/emulador
        catalog = (typeof window !== 'undefined' && Array.isArray(window.catalog) && window.catalog.length)
            ? window.catalog
            : (Array.isArray(mockCatalog) ? mockCatalog : []);
    }
}

// Normaliza un valor de precio proveniente del catálogo en distintos formatos.
// Maneja:
// - Números ya válidos (retorna tal cual)
// - Strings con símbolos de moneda (US$, $, ARS) y espacios
// - Miles con punto y decimales con coma ("1.234,56")
// - Miles con coma y decimales con punto ("1,234.56")
function normalizePrice(value) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }
    if (value == null) return 0;
    let s = String(value).trim();
    if (!s) return 0;
    // Quitar símbolos y letras comunes
    s = s.replace(/[A-Za-z$€£¥₱₽₹\s]/g, '');
    // Si contiene coma y punto, decidir cuál es el decimal
    const hasComma = s.includes(',');
    const hasDot = s.includes('.');
    if (hasComma && hasDot) {
        // Heurística: si la última coma está después del último punto, la coma es decimal (formato "1.234,56")
        const lastComma = s.lastIndexOf(',');
        const lastDot = s.lastIndexOf('.');
        if (lastComma > lastDot) {
            // El punto es separador de miles: eliminar todos los puntos, convertir coma a punto
            s = s.replace(/\./g, '');
            s = s.replace(/,/g, '.');
        } else {
            // La coma es miles: eliminar todas las comas, mantener punto decimal
            s = s.replace(/,/g, '');
        }
    } else if (hasComma && !hasDot) {
        // Solo coma: probablemente decimal -> reemplazar por punto
        s = s.replace(/,/g, '.');
    } else if (!hasComma && hasDot) {
        // Solo punto: puede ser decimal o miles; intentar remover miles si hay más de un punto
        const parts = s.split('.');
        if (parts.length > 2) {
            // Considerar todos menos el último como miles: unirlos sin puntos
            const dec = parts.pop();
            s = parts.join('') + '.' + dec;
        }
    }
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? n : 0;
}

window.onload = async () => {
    await loadCatalogFromFirestore();
    renderCatalog();
    updateCartView();
    navigate('home');
};
// import { mockCatalog } from '../data/catalog.js';
