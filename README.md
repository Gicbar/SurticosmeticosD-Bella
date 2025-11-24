# 🏪 Sistema de Gestión para Tienda

Sistema completo de gestión empresarial desarrollado con **Next.js 15**, **React 19**, **TypeScript** y **Supabase**. Diseñado para pequeñas y medianas tiendas que necesitan control total sobre inventario, ventas, gastos y clientes.

## ✨ Características Principales

### 🔐 Autenticación y Permisos
- Sistema de autenticación con email y contraseña
- Roles de usuario: Administrador, Vendedor, Contador
- Permisos personalizables por rol
- Protección de rutas basada en roles

### 📊 Dashboard Inteligente
- Métricas en tiempo real: productos, ventas, ingresos y ganancias
- Alertas de stock bajo configurables
- Visualización de ventas recientes
- Resumen de clientes registrados

### 🛍️ Punto de Venta (POS)
- Interfaz rápida y eficiente para ventas
- **Escaneo de códigos de barras** con auto-enfoque
- Búsqueda manual de productos
- Carrito de compras con control de cantidades
- Selección de cliente y método de pago
- Cálculo automático de totales

### 📦 Gestión de Inventario
- Control de productos con categorías
- Gestión de proveedores
- **Sistema FIFO** (First In, First Out) para lotes de compra
- Registro de movimientos de inventario
- Alertas automáticas de stock mínimo
- Historial completo de compras por lote

### 💰 Control Financiero
- Registro detallado de ventas
- **Cálculo automático de ganancias** por venta
- Margen de ganancia en tiempo real
- Gestión de gastos por categoría
- Filtros por fecha y cliente
- **Exportación a CSV** de reportes de ventas

### 👥 Gestión de Clientes
- Base de datos de clientes
- Información de contacto completa
- Historial de compras por cliente
- Búsqueda y filtrado rápido

### 📈 Reportes y Análisis
- Historial completo de ventas
- Detalles de cada transacción
- Análisis de rentabilidad
- Resumen de gastos mensuales
- Exportación de datos para análisis externo

## 🛠️ Tecnologías Utilizadas

- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19, TypeScript
- **Estilos**: Tailwind CSS v4
- **Componentes UI**: shadcn/ui + Radix UI
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Formularios**: React Hook Form + Zod
- **Gráficos**: Recharts
- **Iconos**: Lucide React

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 18.x o superior
- **npm** o **yarn** o **pnpm**
- Una cuenta en **Supabase** (gratuita)

## 🚀 Instalación

### 1. Clonar o descargar el proyecto

\`\`\`bash
# Si tienes el código en un repositorio
git clone <url-del-repositorio>
cd sistema-gestion-tienda

# O simplemente descomprime el archivo ZIP descargado
\`\`\`

### 2. Instalar dependencias

\`\`\`bash
# Elimina instalaciones previas si existen
rm -rf node_modules package-lock.json

# Instala las dependencias limpias
npm install
\`\`\`

**Nota importante**: Si encuentras errores de dependencias, NO uses `--legacy-peer-deps` ni `--force`. Este proyecto usa React 19 y todas las dependencias son compatibles.

### 3. Configurar Supabase

#### a) Crear un proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Guarda la contraseña de la base de datos

#### b) Obtener las credenciales

1. En tu proyecto de Supabase, ve a **Settings** → **API**
2. Copia los siguientes valores:
   - **Project URL** (URL del proyecto)
   - **anon/public key** (Clave anónima)

#### c) Configurar variables de entorno

1. Copia el archivo de ejemplo:

\`\`\`bash
cp .env.example .env.local
\`\`\`

2. Edita `.env.local` y reemplaza con tus credenciales:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

### 4. Configurar la base de datos

Ejecuta los scripts SQL en el orden correcto desde el **SQL Editor** de Supabase:

1. Ve a tu proyecto en Supabase
2. Abre **SQL Editor** en el menú lateral
3. Ejecuta cada script en orden:

#### Script 1: Crear tablas (`scripts/001_create_tables.sql`)
\`\`\`sql
-- Copia y pega el contenido del archivo 001_create_tables.sql
-- Este script crea todas las tablas necesarias
\`\`\`

#### Script 2: Habilitar RLS (`scripts/002_enable_rls.sql`)
\`\`\`sql
-- Copia y pega el contenido del archivo 002_enable_rls.sql
-- Este script configura las políticas de seguridad
\`\`\`

#### Script 3: Crear funciones (`scripts/003_create_functions.sql`)
\`\`\`sql
-- Copia y pega el contenido del archivo 003_create_functions.sql
-- Este script crea funciones para FIFO y cálculos
\`\`\`

#### Script 4: Datos de prueba (opcional) (`scripts/004_seed_data.sql`)
\`\`\`sql
-- Copia y pega el contenido del archivo 004_seed_data.sql
-- Este script inserta datos de ejemplo para probar
\`\`\`

### 5. Ejecutar el proyecto

\`\`\`bash
npm run dev
# o
yarn dev
# o
pnpm dev
\`\`\`

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 👤 Primer Uso

### Crear tu primera cuenta

1. Abre [http://localhost:3000](http://localhost:3000)
2. Haz clic en **"Registrarse"**
3. Completa el formulario:
   - Email
   - Contraseña
   - Nombre completo
   - Rol (selecciona **Administrador** para tu primera cuenta)
4. Revisa tu email para confirmar la cuenta
5. Inicia sesión con tus credenciales

### Configuración inicial recomendada

1. **Crear categorías**: Ve a Dashboard → Categorías
2. **Agregar proveedores**: Ve a Dashboard → Proveedores
3. **Registrar productos**: Ve a Dashboard → Productos
4. **Agregar lotes de compra**: En cada producto, registra el inventario inicial
5. **Crear clientes**: Ve a Dashboard → Clientes (opcional)

## 📱 Uso del Sistema

### Realizar una venta (POS)

1. Ve a **Dashboard → Punto de Venta**
2. Escanea el código de barras o busca el producto manualmente
3. Ajusta las cantidades según necesites
4. Selecciona el cliente (opcional)
5. Elige el método de pago
6. Haz clic en **"Completar Venta"**

### Gestionar inventario

1. **Agregar productos**: Dashboard → Productos → Nuevo Producto
2. **Registrar compras**: Desde la lista de productos, haz clic en "Agregar Lote"
3. **Ver movimientos**: Dashboard → Inventario

### Ver reportes

1. **Ventas**: Dashboard → Ventas
   - Filtra por fecha o cliente
   - Exporta a CSV para análisis
2. **Gastos**: Dashboard → Gastos
3. **Dashboard principal**: Métricas generales y alertas

## 🔒 Seguridad

- **Row Level Security (RLS)** habilitado en todas las tablas
- Autenticación segura con Supabase Auth
- Permisos basados en roles
- Variables de entorno para credenciales sensibles
- Validación de formularios con Zod

## 📦 Estructura del Proyecto

\`\`\`
sistema-gestion-tienda/
├── app/                      # Rutas de Next.js (App Router)
│   ├── auth/                # Páginas de autenticación
│   ├── dashboard/           # Páginas del sistema
│   │   ├── pos/            # Punto de venta
│   │   ├── products/       # Gestión de productos
│   │   ├── sales/          # Historial de ventas
│   │   ├── expenses/       # Gestión de gastos
│   │   ├── clients/        # Gestión de clientes
│   │   └── ...
│   ├── layout.tsx          # Layout principal
│   └── page.tsx            # Página de inicio
├── components/              # Componentes reutilizables
│   ├── ui/                 # Componentes de shadcn/ui
│   ├── dashboard-sidebar.tsx
│   ├── pos-interface.tsx
│   └── ...
├── lib/                     # Utilidades y configuración
│   ├── supabase/           # Clientes de Supabase
│   └── auth.ts             # Helpers de autenticación
├── scripts/                 # Scripts SQL para la base de datos
│   ├── 001_create_tables.sql
│   ├── 002_enable_rls.sql
│   ├── 003_create_functions.sql
│   └── 004_seed_data.sql
├── .env.example            # Ejemplo de variables de entorno
├── package.json            # Dependencias del proyecto
└── README.md              # Este archivo
\`\`\`

## 🐛 Solución de Problemas

### Error: "Invalid API key"
- Verifica que las variables de entorno en `.env.local` sean correctas
- Asegúrate de haber copiado la **anon key** y no la **service role key**

### Error: "Failed to fetch"
- Verifica que la URL de Supabase sea correcta
- Comprueba tu conexión a internet
- Revisa que el proyecto de Supabase esté activo

### No puedo iniciar sesión
- Verifica que hayas confirmado tu email
- Revisa la carpeta de spam
- Intenta restablecer la contraseña

### Los productos no aparecen en el POS
- Asegúrate de haber creado productos
- Verifica que los productos tengan lotes de compra con stock disponible
- Revisa que el código de barras esté correctamente registrado

## 🤝 Contribuciones

Este es un proyecto de código abierto. Las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa la sección de **Solución de Problemas**
2. Consulta la documentación de [Next.js](https://nextjs.org/docs)
3. Consulta la documentación de [Supabase](https://supabase.com/docs)
4. Abre un issue en el repositorio

## 🎯 Roadmap

Características planeadas para futuras versiones:

- [ ] Reportes gráficos avanzados
- [ ] Integración con impresoras de tickets
- [ ] App móvil con React Native
- [ ] Múltiples sucursales
- [ ] Integración con facturación electrónica
- [ ] Sistema de descuentos y promociones
- [ ] Programa de lealtad para clientes

---

Desarrollado con ❤️ para pequeñas y medianas empresas
