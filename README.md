# Falta 1 — Fútbol amateur en Montevideo

App web para organizar partidos de fútbol 5 y 7 en Montevideo, Uruguay.

## Qué funciona

- Login con Google (real, con Firebase Auth)
- Base de datos en tiempo real (Firestore)
- Ver y filtrar partidos disponibles
- Ver todas las canchas de Montevideo
- Anotarse a un partido
- Reservar una cancha
- Crear un partido
- Perfil de usuario con estadísticas
- Integración con MercadoPago (via Cloud Functions)
- Sistema de penalizaciones
- Reglas de seguridad de Firestore

---

## PASO 1: Configurar Firebase (gratis)

### 1.1 Crear proyecto en Firebase

1. Ir a https://console.firebase.google.com
2. Clic en "Agregar proyecto"
3. Nombre: `falta1`
4. Crear proyecto

### 1.2 Habilitar Authentication con Google

1. Authentication → Sign-in method
2. Habilitar Google → Guardar

### 1.3 Crear base de datos Firestore

1. Firestore Database → Crear base de datos
2. Modo: Producción
3. Región: us-central1

### 1.4 Obtener configuración

1. Configuración del proyecto (tuerca) → General
2. Tus apps → Web (</>) → Copiar firebaseConfig

### 1.5 Crear el archivo .env

```
cp .env.example .env
```

Completar `.env` con los valores de Firebase.

---

## PASO 2: Configurar MercadoPago

### 2.1 Obtener credenciales

1. mercadopago.com.uy → Tu negocio → Credenciales
2. Copiar:
   - Public Key (para el frontend)
   - Access Token (SECRETO — solo para el servidor)

### 2.2 Instalar Firebase CLI y loguearse

```
npm install -g firebase-tools
firebase login
firebase use --add
```

### 2.3 Configurar Access Token como Secret de Firebase

```
firebase functions:secrets:set MP_ACCESS_TOKEN
```

(Ingresar el valor cuando lo pide)

### 2.4 Instalar dependencias de las funciones

```
cd functions
npm install
cd ..
```

---

## PASO 3: Deployar Cloud Functions

```
firebase deploy --only functions
```

NOTA: Las Cloud Functions requieren el plan Blaze de Firebase.
El plan es gratis hasta 2 millones de invocaciones/mes.
Para una app chica, el costo real es $0.

Para activar Blaze: Firebase Console → Uso y facturación → Modificar plan → Blaze

---

## PASO 4: Deployar reglas de Firestore

```
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## PASO 5: Correr la app localmente

```
npm install
npm run dev
```

La app corre en http://localhost:5173

---

## Estructura del proyecto

```
falta1-app/
├── src/
│   ├── context/       # AuthContext (Google login)
│   ├── firebase/      # config.js + firestore.js
│   ├── data/          # canchas.js + partidos.js (datos estáticos)
│   ├── screens/       # Login, Home, Canchas, Crear, Perfil
│   ├── modals/        # PaymentModal, ReservaModal
│   ├── components/    # BottomNav
│   ├── App.jsx
│   └── main.jsx
├── functions/         # Cloud Functions (MercadoPago backend)
│   ├── index.js
│   └── package.json
├── firestore.rules    # Reglas de seguridad
├── firestore.indexes.json
└── firebase.json
```

---

## Colecciones de Firestore

- usuarios: Perfiles de jugadores
- partidos: Partidos creados
- reservas: Reservas de canchas
- pagos: Registro de pagos aprobados

---

## Costos

- Firebase Auth: $0 ilimitado
- Firestore: $0 hasta 50K lecturas/dia y 20K escrituras/dia
- Cloud Functions (Blaze): $0 hasta 2M invocaciones/mes
- Hosting Firebase: $0 hasta 10GB
- MercadoPago: 0% comision de plataforma (MP cobra su comision habitual)
