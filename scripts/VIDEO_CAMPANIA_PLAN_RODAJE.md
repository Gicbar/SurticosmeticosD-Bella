# PLAN DE RODAJE — Video publicitario de campaña

Solo grabación real de pantalla del celular + voz IA. Vertical 9:16, ~45 segundos.

Reemplaza antes de grabar:
- `[TIENDA]` · `[CATEGORÍA]` · `[X%]` · `[FECHA]` · `[URL]`

---

## ORDEN DE GRABACIÓN — Pantalla del celular (una sola toma corrida)

Activa la grabadora de pantalla nativa del celular. Hazlo todo seguido sin cortar — luego recortas en edición.

1. Desbloquea el celular y abre el navegador.
2. Escribe la URL del catálogo y entra. Espera a que cargue completo.
3. Scroll lento por el grid (3–4 segundos). Detente sobre un producto en promoción.
4. Abre 1 producto en promoción → ciérralo.
5. Toca un producto → "Añadir al pedido" → ciérralo. Repite con 2 productos más (que se vea el badge subiendo: 1 → 2 → 3).
6. Abre el carrito.
7. Escribe el nombre "Laura M." en el campo Nombre.
8. Escribe un teléfono en el campo Teléfono (puedes desenfocar después).
9. Toca el botón principal para generar el pedido.
10. **Espera al modal de éxito con código `#NNNN`. Mantén la pantalla quieta 4 segundos.**
11. Toca el botón de WhatsApp → deja que abra el chat con el mensaje pre-armado. Mantén 3 segundos.
12. Detén la grabación.

> Si el código sale feo (ej. `#1003`), repite el flujo hasta que salga uno corto/redondo.

---

## TEXTOS EN PANTALLA (subtítulos quemados, uno por escena)

| Momento | Texto | Duración |
|---|---|---|
| Apertura (al desbloquear el celular y abrir navegador) | `HASTA [X%] OFF EN [CATEGORÍA]` | 0:00 – 0:04 |
| Entrar al catálogo | `1. Entra al catálogo` | 0:04 – 0:09 |
| Productos en promoción | `2. Mira los productos en promoción` | 0:09 – 0:16 |
| Añadir al carrito | `3. Arma tu pedido` | 0:16 – 0:24 |
| Datos en el carrito | `4. Tus datos · Precio congelado` | 0:24 – 0:32 |
| Modal con código | `5. Tu código de pedido` | 0:32 – 0:38 |
| WhatsApp | `6. Confirmas por WhatsApp y pasas al punto físico` | 0:38 – 0:43 |
| Cierre | `[X%] OFF en [CATEGORÍA]`<br>`Hasta el [FECHA]`<br>`[URL]` | 0:43 – 0:48 |
| Aviso legal pequeño (final) | `Sujeto a disponibilidad. Precio reservado por X días.` | 0:46 – 0:48 |

---

## TEXTO EN PANTALLA OPCIONAL (microcopy de refuerzo)

Estos los pones flotando junto al elemento que están señalando:

- Sobre el chip de oferta del producto → `-[X%]`
- Sobre el precio tachado → `Antes`
- Sobre el badge del carrito subiendo → `+1`
- Sobre el código `#NNNN` en el modal → `Tu código`
- Sobre el botón verde de WhatsApp → `Confirmas aquí`

---

## VOZ EN OFF — Script exacto

Pásalo tal cual a la herramienta. Las pausas (…) ayudan al ritmo.

```
En [TIENDA] estrenamos descuentos en [CATEGORÍA]…
y los reservas desde tu celular.

Abre el catálogo, elige tus productos,
escribe tu nombre y tu WhatsApp,
y el precio queda congelado para ti.

Recibes tu código de pedido al instante,
confirmas por WhatsApp,
y pasas por tus productos al punto físico.

[TIENDA]. Tu pedido, tu precio, tu descuento.
```

---

## HERRAMIENTA PARA LA VOZ

**Recomendada: ElevenLabs** — la mejor en español latino hoy.

- Plan: **Starter (USD 5/mes)** — alcanza de sobra para varios videos.
- Modelo: **Eleven Multilingual v2** (o v3 si ya está disponible en tu cuenta).
- Voces sugeridas para tu tipo de marca (femenina, cálida, beauty):
  1. **Valentina** — joven, suave, beauty/lifestyle. *Primera opción.*
  2. **Lucía** — más madura, premium.
  3. **Sofía** — neutra, comercial.
- Ajustes:
  - **Stability:** 45–55
  - **Similarity:** 75
  - **Style exaggeration:** 15–25
  - **Speaker boost:** ON
- Pega el script completo, dale generar, descarga el MP3.

**Alternativas si no quieres ElevenLabs:**
- **PlayHT** — voces "Camila ES-CO" o "Sofía" (más colombianas).
- **Murf.ai** — voz "Valeria" en español latino.
- **OpenAI TTS** (api o ChatGPT) — voz "nova" o "shimmer" en español, calidad decente, más barato.

> Evita las voces gratuitas de CapCut/TikTok: suenan robóticas y bajan la percepción de la marca.

---

## ENSAMBLE FINAL (CapCut, orden de pistas)

1. **Pista de video:** la grabación de pantalla recortada según la tabla de tiempos.
2. **Pista de voz en off:** alineada con cada escena.
3. **Pista de música:** instrumental de fondo a -18 dB cuando habla la voz, sube a -10 dB en el cierre.
4. **Pista de subtítulos:** texto quemado de la tabla, fuente sans-serif gruesa, fondo translúcido.
5. **Exportar:** 1080×1920, 30 fps, MP4.
