# Numera — Registro Contable Personal

Aplicación web de finanzas personales full-stack con autenticación JWT multi-usuario. Cada usuario gestiona sus propios registros de forma aislada.

**Stack:** React + Vite · Express 5 · MongoDB Atlas · Firebase Hosting · Vercel (API)

---

## Módulos

### Dashboard
- Resumen financiero del período: balance, ingresos, gastos y ahorro
- Selector de período: semana actual, mes actual, mes anterior, año, y mes específico con picker
- Gráfico de flujo de caja (área) y distribución de gastos por categoría (barras)
- Widgets de tarjetas y cuentas bancarias vinculadas
- Transacciones recientes

### Transacciones
- Historial completo de ingresos y gastos ordenados por fecha
- Filtro por tipo de flujo (todos / solo ingresos / solo gastos)
- Paginación de 10 registros por página
- Eliminación con confirmación inline (sin modales)
- Agregar ingreso o gasto con selección de cuenta o tarjeta de origen

### Analíticas
- Reportes de comportamiento financiero por período
- Gráficos de tendencia de ingresos vs gastos
- Distribución de categorías de gasto

### Presupuestos
- **Presupuesto Base Cero:** define tu ingreso base del período y asigna cada peso a una categoría hasta llegar a cero sin asignar
- Creación de presupuestos por categoría con período recurrente (mensual, quincenal, semanal, anual) o **rango de fechas personalizado**
- Tracking automático: compara el límite contra los gastos reales del período activo
- Barra de progreso con código de color (verde → amarillo → naranja → rojo)
- **Proyección:** extrapola el gasto actual al fin del período para anticipar excesos
- **Rollover:** el saldo no usado del período anterior se acumula al siguiente
- Alertas inline cuando hay presupuestos excedidos o en riesgo
- Score de salud financiera global con barra de uso total

### Metas Financieras
- Creación de objetivos de ahorro con monto y fecha objetivo
- Registro de abonos parciales o ajuste directo del total acumulado
- Barra de progreso por meta
- Confeti animado al alcanzar el 100%
- Resumen: total ahorrado vs total objetivo

### Fondos
- Gestión de cuentas bancarias y efectivo
- Gestión de tarjetas de crédito y débito
- Saldo de deuda en crédito vs saldo disponible en débito
- Sincronización automática de saldos al registrar transacciones vinculadas
- Edición de saldo con clic directo sobre la tarjeta

### Deudas
- Registro de compromisos financieros con acreedor, monto total y monto pagado
- Barra de progreso de pago por deuda
- Resumen: deuda total, pagado, pendiente

### Ajustes
- Selector de moneda de visualización

---

## Autenticación

- Registro e inicio de sesión con email y contraseña
- Contraseñas hasheadas con **argon2id**
- Tokens **JWT** (12 h de expiración) transmitidos por header `Authorization: Bearer`
- Todos los endpoints de datos requieren token válido
- El primer usuario registrado hereda automáticamente los registros existentes sin `uid` (migración)
- Cada usuario ve y opera exclusivamente sus propios datos

---

## Arquitectura

```
┌─────────────────────────────┐     ┌───────────────────────────────┐
│  Frontend (React + Vite)    │     │  Backend (Express 5 + Node)    │
│  Firebase Hosting           │────▶│  Vercel Serverless             │
│                             │     │                                │
│  /src                       │     │  /api                          │
│  ├── pages/                 │     │  ├── auth/                     │
│  │   ├── Dashboard.jsx      │     │  │   ├── auth_controller.js    │
│  │   ├── Transactions.jsx   │     │  │   ├── auth_routes.js        │
│  │   ├── Presupuesto.jsx    │     │  │   ├── generate_jwt.js       │
│  │   ├── Goals.jsx          │     │  │   └── validate_jwt.js       │
│  │   ├── Fondos.jsx         │     │  ├── tools/                    │
│  │   ├── Deudas.jsx         │     │  │   ├── get_records.js        │
│  │   ├── Analytics.jsx      │     │  │   ├── insert_record.js      │
│  │   ├── Login.jsx          │     │  │   ├── update_record.js      │
│  │   └── Register.jsx       │     │  │   └── delete_record.js      │
│  ├── components/            │     │  ├── db.js                     │
│  ├── context/               │     │  └── index.js                  │
│  │   └── AuthContext.jsx    │     │                                │
│  └── utils/                 │     └───────────────────────────────┘
│      └── apiFetch.js        │                   │
└─────────────────────────────┘                   ▼
                                     ┌────────────────────┐
                                     │  MongoDB Atlas      │
                                     │                     │
                                     │  Collections:       │
                                     │  · users            │
                                     │  · entradas         │
                                     │  · gastos           │
                                     │  · objetivos        │
                                     │  · tarjetas         │
                                     │  · cuentas          │
                                     │  · deudas           │
                                     │  · presupuestos     │
                                     └────────────────────┘
```

---

## Variables de entorno

### Backend (`.env` local / Vercel Dashboard)
| Variable | Descripción |
|----------|-------------|
| `MONGODB_URI` | URI de conexión a MongoDB Atlas |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT |

### Frontend (`.env` en `/frontend`)
| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL base de la API (vacío en producción usa ruta relativa) |

---

## Instalación local

```bash
# Clonar repositorio
git clone https://github.com/Zodiacal0/regustro-de-cuentas.git
cd regustro-de-cuentas

# Instalar dependencias del backend
npm install

# Instalar dependencias del frontend
cd frontend && npm install

# Crear .env en la raíz con MONGODB_URI y JWT_SECRET
cp .env.example .env

# Desarrollo
npm run dev          # Backend en :3000
cd frontend && npm run dev   # Frontend en :5173
```

## Deploy

```bash
# Frontend → Firebase
cd frontend && npm run build
firebase deploy --only hosting

# Backend → Vercel (auto-deploy en push a master)
git push origin master
```
