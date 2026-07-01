# Guía de uso — Pantalla de Reposición

Esta guía explica **qué vas a ver** en la tab "Reposición" de Reportes, **qué significa cada cosa** y **qué hacer con ella**. Escrito para el dueño/gerente, no para el programador.

---

## ¿Qué problema resuelve esta pantalla?

Antes tenías dos vistas separadas:
- **Inventario**: cuánto stock hay.
- **Ventas**: qué se vendió.

Pero faltaba la pregunta clave:

> "De lo que se vende bien, ¿qué se me está acabando, y cuánto debo comprar, sin gastar de más ni quedarme corto?"

Esta pantalla **cruza** ventas + inventario + comportamiento histórico, y te responde con una **lista priorizada** de qué comprar, cuánto, y a qué proveedor.

**Importante**: ignora el campo "stock mínimo" del producto. Confía en lo que realmente se mueve (ventas) y lo que realmente hay (inventario en batches). Los mínimos escritos a mano no se respetan.

---

## Cómo se divide la pantalla (3 secciones)

### 🚨 Sección 1 — Acción inmediata

Lo primero que ves al entrar. Son los **fuegos a apagar hoy**.

**3 números grandes arriba**:
- **Productos agotados**: cuántos SKUs están en 0 pero la gente los pide.
- **En riesgo esta semana**: cuántos se van a agotar antes de que llegue un pedido nuevo.
- **Dinero en riesgo**: cuánto margen dejas de ganar si no actúas.

**Tabla "Comprar YA"**: lista de productos ordenada por **cuánta plata estás perdiendo**, no por volumen. Arriba lo que más duele.

Columnas:
- **Producto**
- **Clase**: ⭐ Clave / ◼ Normal / · Marginal — ver más abajo.
- **Patrón**: 📈 Estable / 📊 Variable / ⚡ Errático.
- **Tendencia**: ↗ Subiendo / → Estable / ↘ Bajando.
- **Stock**: cuántas unidades quedan.
- **Vendido**: cuántas se vendieron en el período seleccionado.
- **Sugerido**: cuántas comprar.
- **Costo estimado**: cuánto te costaría ese pedido.
- **Proveedor**.

Al desplegar una fila, te explica en lenguaje simple **por qué** el número sugerido:
> "Vendes ~12/día, tienes 8 en stock → se acaba en ~1 día. El proveedor tarda 5 días en traerlo, quieres 30 días de cobertura. Compra **~410 uds**."

### 📋 Sección 2 — Orden de compra sugerida

Lo mismo de arriba pero **agrupado por proveedor**, listo para pasar a compras.

- Subtotal por proveedor.
- Total global de la orden.
- Botón **"📥 Descargar Excel"** — baja un archivo con 2 hojas:
  - **Orden**: limpia, para enviar/imprimir (producto, cantidad, costo, proveedor).
  - **Análisis**: completa, con las columnas técnicas (velocidad, cobertura, stock de seguridad) por si quieres revisar.

### 📊 Sección 3 — Diagnóstico de portafolio

Vista estratégica. No es acción inmediata, es para **entender tu negocio**.

- **Matriz ABC × Patrón** (9 celdas): te dice cuántos productos tienes en cada combinación (ej. "12 productos Clave y Estables", "3 productos Clave y Erráticos — ojo con estos").
- **Capital dormido**: productos con exceso de stock o que no se venden hace 60+ días. Plata quieta. Candidatos a liquidar o no volver a pedir.
- **Ventas perdidas**: productos que te están costando dinero por estar agotados.
- **Distribución de cobertura**: histograma con cuántos SKUs te duran 0–7 días, 8–15 días, etc. Idealmente la masa está en 15–60 días; si hay mucho en >90, tienes sobrestock; si hay mucho en <7, estás subabastecido.

---

## Cómo leer las etiquetas

### Clase (importancia)

Se calcula con la regla **80/20 (Pareto)** aplicada al **margen** que genera cada producto.

- **⭐ Clave (A)** → el 20% de productos que te dan el 80% del margen. Son intocables, siempre debes tenerlos.
- **◼ Normal (B)** → contribución media. Importantes pero no críticos.
- **· Marginal (C)** → la cola larga. Venden poco, a veces no vale la pena mantenerlos en stock profundo.

### Patrón (predecibilidad)

Mide qué tan **estable** es la demanda semana a semana.

- **📈 Estable** → vende parejo, fácil de pronosticar. Poco stock de seguridad.
- **📊 Variable** → hay semanas buenas y malas. Se compensa con algo más de colchón.
- **⚡ Errático** → a veces vende 0, a veces vende mucho. Mucho colchón o simplemente no stockear hondo.

### Tendencia (dirección)

Regresión sobre las últimas semanas:

- **↗ Subiendo** → viene creciendo. Pedir un poco más de lo usual.
- **→ Estable** → sin cambio significativo.
- **↘ Bajando** → viene cayendo. Pedir menos; o investigar por qué.

### Estado (urgencia)

Semáforo visual en cada producto:

| Estado | Qué significa | Qué hacer |
|---|---|---|
| 🚨 **Agotado** | Stock en 0 y hay demanda | Comprar hoy |
| ⚠ **Crítico** | Se acaba antes de que llegue un pedido nuevo | Comprar esta semana |
| 🟠 **Bajo** | Menos de medio mes de inventario | Agendar compra |
| 🟢 **OK** | Todo bien | Nada |
| 💤 **Dormido** | Sobrestock o sin venta hace 60+ días | Considerar liquidar, no reponer |

---

## Parámetros que usa el sistema (para tu referencia)

No necesitas cambiarlos, pero es bueno saberlos:

- **Tiempo de entrega del proveedor**: 5 días.
- **Cobertura objetivo** (qué tanto inventario querer tener):
  - ⭐ Clave: 30 días.
  - ◼ Normal: 45 días.
  - · Marginal: 60 días.
- **Nivel de servicio** (qué tan paranoico ser con no quedarse sin stock):
  - ⭐ Clave: 98% (casi nunca se agotan).
  - ◼ Normal: 95%.
  - · Marginal: 90% (aceptable quedarse corto ocasionalmente).
- **Umbral de sobrestock**: más de 90 días de cobertura o 60 días sin venta.
- **Pronóstico**: promedio ponderado de las últimas 4 semanas, ajustado por tendencia.

---

## Preguntas frecuentes

**¿Por qué no me respeta el "stock mínimo" que puse en el producto?**
Porque en la práctica ese campo suele estar desactualizado o nunca se llenó bien. El sistema prefiere mirar tus **ventas reales** y calcular el mínimo dinámicamente: si un producto subió el doble el último mes, el mínimo sube solo.

**¿Por qué el número sugerido cambia si cambio el período en la cabecera?**
Porque la velocidad de venta se mide en ese período. Si pones "últimos 7 días" y hubo una feria rara, puede distorsionar. Para decisiones de compra, se recomienda **período de 30 a 90 días**.

**¿Por qué un producto aparece como "⚡ Errático"?**
Porque vendió 0 uds varias semanas y mucho en otras. El sistema te avisa para que **no compres a ciegas**: con este patrón es mejor pedir poquito y seguido, no un pedido grande.

**¿Qué hago con los productos "💤 Dormidos"?**
Están comiendo capital. Opciones: (1) bajarles precio para rotarlos, (2) combinarlos con otros productos, (3) devolverlos al proveedor si se puede, (4) aceptar la pérdida y no volver a pedirlos.

**¿El sistema ordena solo?**
No. **Solo sugiere**. La decisión final es tuya. El botón de Excel te descarga la orden para que la revises, ajustes y pases a tu proveedor por el canal que uses.

**¿Qué pasa con productos nuevos que tienen poca historia?**
Si tienen menos de 14 días de ventas, se usa un cálculo simple sin tendencia ni estacionalidad, y se marcan con una advertencia. Conforme pasa el tiempo, el análisis se vuelve más fino.

**¿De dónde sale el "dinero en riesgo"?**
`margen por unidad × unidades que venderías al día × días que proyectas estar agotado`. Es una estimación conservadora de lo que dejas de ganar mientras no repones.

---

## Flujo recomendado de uso

1. **Cada mañana**: abrir la pantalla, mirar los 3 KPIs y la tabla "Comprar YA". Si hay rojos, actuar el mismo día.
2. **Una vez por semana**: descargar el Excel de "Orden de compra sugerida", revisarlo con calma, ajustar cantidades según negociación con proveedor, y enviarlo.
3. **Una vez al mes**: revisar la Sección 3 (Diagnóstico). ¿Está creciendo el capital dormido? ¿Cuántos productos nuevos se volvieron ⭐ Clave? ¿Hay tendencias a la baja que hay que investigar?

---

## Si algo parece raro

- **Un producto sugiere comprar cero pero sé que se vende**: revisa que sus ventas estén registradas en el POS y no como "ajuste de inventario".
- **Un proveedor aparece como "Sin proveedor"**: ve a Productos y asigna `supplier_id` al producto.
- **El costo estimado dice "Costo por definir"**: no hay batch de compra previo con precio. Carga una compra con precio para que el sistema aprenda.
- **La recomendación parece muy alta o muy baja**: cambia el período en la cabecera a 60 o 90 días y compara — períodos cortos son más sensibles a ruido.
