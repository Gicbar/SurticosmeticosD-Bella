# Video Campaña — Mes de las Madres (Mayo 2026)
## Surti Cosméticos D'Bella

> **Concepto:** "Este mayo, regálale belleza a quien te dio la vida"
> Tres niveles de descuento ascendentes (10%, 20%, 30%) presentados como un crescendo emocional en honor al Día de las Madres.

> **Herramienta de voz:** [ElevenLabs Text-to-Speech](https://elevenlabs.io/app/speech-synthesis/text-to-speech)
> **Modelo usado:** `Eleven Multilingual v2`
> Todo el guion está optimizado SIN audio tags (porque v2 NO las interpreta), usando solo puntuación expresiva y pausas explícitas (`<break time="…s" />`), que sí funcionan en v2.

---

## ⚠️ Importante para Multilingual v2

`Multilingual v2` **NO entiende** etiquetas tipo `[con ternura]`, `[susurra]`, `[con emoción]`. Si las dejas, el modelo las leerá literalmente como si fueran palabras (dirá *"con ternura"*).

✅ **Lo que SÍ funciona en v2:**
- `<break time="0.5s" />` → pausas exactas (de 0.1s a 3s)
- `…` (puntos suspensivos) → pausa larga + énfasis emocional
- `,` `.` → pausas cortas y medias
- **MAYÚSCULAS** → eleva tono e intensidad
- `¿…?` `¡…!` → curva de entonación correcta en español
- Repetir la misma frase con distintos signos cambia la inflexión

❌ **Lo que NO funciona en v2** (eliminar antes de generar):
- Etiquetas `[…]` de emoción
- `<emphasis>` y otras etiquetas SSML que no sean `<break>`

> 💡 Para compensar la falta de audio tags en v2, **la emoción se logra con tres palancas:**
> 1. Elegir bien la voz (ver abajo).
> 2. Ajustar Stability/Similarity/Style por bloque.
> 3. Generar 3–5 veces y quedarse con la mejor toma.

---

## Datos generales del video

| Aspecto | Detalle |
|---|---|
| **Duración total** | 35–40 segundos |
| **Formato** | Vertical 9:16 (Reels / TikTok / Stories) |
| **Tono de voz** | Mujer, cálida, cercana, con un toque emotivo |
| **Música de fondo** | Suave al inicio, sube en intensidad hacia el clímax |
| **Productos en pantalla** | 6 en total (2 por cada nivel de descuento) |
| **Vigencia mensaje** | Todo el mes de mayo |

---

## ⚙️ Configuración recomendada en ElevenLabs (Multilingual v2)

### Voces sugeridas para español latino emotivo
- **"Mariana"** — cálida, ideal para narrativa emocional
- **"Valentina"** — joven y dulce, buena para Stories
- **"Sofia"** — más madura, encaja con el mensaje del Día de las Madres

> Si tu cuenta no las tiene, busca en **Voice Library** filtrando por: idioma `Spanish (Latin American)`, género `Female`, accent `Colombian` o `Mexican`, mood `Warm` / `Emotional`.

### Sliders por tipo de bloque

| Bloque | Stability | Similarity | Style | Speed | Por qué |
|---|---|---|---|---|---|
| **Intro / Cierre emotivo** | `30` | `80` | `45` | `0.92` | Stability bajo = más variación, voz "respira" |
| **Niveles 10% y 20%** | `40` | `80` | `35` | `0.95` | Estable y claro, fácil de entender el producto |
| **Nivel 30% (clímax)** | `25` | `75` | `55` | `0.93` | Más expresividad y emoción en el momento cumbre |
| **Versión corta 15s** | `35` | `80` | `45` | `0.95` | Balance entre claridad y emoción |

> ⚠️ **Speaker Boost: activado siempre.** Mejora claridad en cualquier voz.

---

## 🎙️ Trucos para que v2 suene emotivo (ya que no hay audio tags)

1. **Pausas largas con `…`** — el modelo respira y suena humano. Úsalo antes de palabras importantes (*"Y para las mamás… que merecen lo extraordinario"*).
2. **Pausas exactas con `<break time="…s" />`** — más confiables que los puntos suspensivos. Combina los dos: `…` para emoción + `<break>` para timing.
3. **MAYÚSCULAS solo en palabras clave** (*"INCREÍBLE TREINTA por ciento"*). Si abusas, suena como gritado. 1–2 palabras por bloque máximo.
4. **Repetir y elegir.** Genera cada bloque 3–5 veces y conserva la toma con mejor inflexión. Cada generación es ligeramente distinta.
5. **Genera bloque por bloque**, NO todo el texto seguido. v2 pierde la línea emocional en textos largos.
6. **Pre-escucha a velocidad 0.95.** Un poquito más lento = más peso emocional. Velocidades por encima de 1.0 suenan apuradas.
7. **Cuando un bloque salga "frío", baja el Stability 5 puntos** y vuelve a generar. Si sale "inestable" o "tembloroso", súbelo 5.

---

## 📜 Guion completo para grabar voz en off

> **Cómo usarlo:** copia y pega cada bloque por separado en ElevenLabs Multilingual v2. Reemplaza `PRODUCTO 1`…`PRODUCTO 6` por el nombre exacto del producto que aparecerá en pantalla.

---

### 🎬 BLOQUE 1 — Introducción emotiva (0:00 – 0:05)
*[Música suave entrando · imágenes de madres con sus hijas]*

> **Sliders:** Stability `30` · Similarity `80` · Style `45` · Speed `0.92`

```
Mayo… <break time="0.7s" /> es el mes más especial del año.

<break time="0.5s" />

Es el mes de quienes nos dieron todo… <break time="0.6s" /> sin pedir nada a cambio.
```

---

### 🎬 BLOQUE 2 — Transición al concepto (0:05 – 0:09)
*[Logo D'Bella aparece · productos en movimiento]*

> **Sliders:** Stability `35` · Similarity `80` · Style `40` · Speed `0.95`

```
Y en Surti Cosméticos D'Bella, <break time="0.4s" /> queremos celebrarlas contigo.

<break time="0.5s" />

Con descuentos pensados para consentirlas… <break time="0.6s" /> como se merecen.
```

---

### 🎬 BLOQUE 3 — Nivel 10% · tono dulce y suave (0:09 – 0:17)
*[Aparecen **PRODUCTO 1** y **PRODUCTO 2** con etiqueta "10% OFF" · fondo rosa pastel]*

> **Sliders:** Stability `40` · Similarity `80` · Style `35` · Speed `0.95`

```
Empezamos con un detalle perfecto.

<break time="0.5s" />

PRODUCTO 1, <break time="0.3s" /> y PRODUCTO 2… <break time="0.6s" /> con un diez por ciento de descuento.

<break time="0.5s" />

Porque mamá… <break time="0.4s" /> merece sentirse hermosa todos los días.
```

---

### 🎬 BLOQUE 4 — Nivel 20% · tono vibrante y ascendente (0:17 – 0:25)
*[Cambio de color a tonos más vibrantes · aparecen **PRODUCTO 3** y **PRODUCTO 4**]*

> **Sliders:** Stability `40` · Similarity `80` · Style `40` · Speed `0.95`

```
Y si quieres sorprenderla aún más…

<break time="0.6s" />

PRODUCTO 3, <break time="0.3s" /> y PRODUCTO 4… <break time="0.5s" /> con un VEINTE por ciento de descuento.

<break time="0.5s" />

El regalo ideal… <break time="0.4s" /> para la mujer que te lo dio todo.
```

---

### 🎬 BLOQUE 5 — Nivel 30% · clímax emotivo (0:25 – 0:33)
*[Tonos dorados/púrpuras intensos · destello · aparecen **PRODUCTO 5** y **PRODUCTO 6**]*

> 🔥 **Sliders especiales para el clímax:** Stability `25` · Similarity `75` · Style `55` · Speed `0.93`
> Esto da la máxima expresividad emocional.

```
Y para las mamás… <break time="0.6s" /> que merecen lo extraordinario.

<break time="0.7s" />

PRODUCTO 5, <break time="0.3s" /> y PRODUCTO 6… <break time="0.5s" /> con un INCREÍBLE TREINTA por ciento de descuento.

<break time="0.6s" />

Una oportunidad única… <break time="0.5s" /> solo este mes.
```

---

### 🎬 BLOQUE 6 — Cierre emotivo y CTA (0:33 – 0:40)
*[Mosaico con los 6 productos · dirección y redes en pantalla]*

> **Sliders:** Stability `30` · Similarity `80` · Style `50` · Speed `0.92`

```
Este mayo… <break time="0.6s" /> regálale belleza a quien siempre te regaló amor.

<break time="0.8s" />

Surti Cosméticos D'Bella.

<break time="0.5s" />

Porque ninguna madre… <break time="0.5s" /> como la tuya.

<break time="0.4s" />

Y ningún regalo… <break time="0.5s" /> como el que sale del corazón.
```

*[Texto en pantalla: "📍 Visítanos · 📲 Pide por WhatsApp · 💐 Feliz Día de las Madres"]*

---

## 🎙️ Versión corta (15 segundos · para Stories)

> **Sliders:** Stability `35` · Similarity `80` · Style `45` · Speed `0.95`

```
Este mayo… <break time="0.5s" /> celebramos a quienes nos dieron todo.

<break time="0.5s" />

En D'Bella, <break time="0.3s" /> descuentos del diez, <break time="0.2s" /> veinte… <break time="0.4s" /> y hasta TREINTA por ciento <break time="0.3s" /> en los productos que más le gustan a mamá.

<break time="0.6s" />

Porque ninguna como ella… <break time="0.4s" /> y ningún regalo como el tuyo.
```

---

## 📝 Textos en pantalla (subtítulos quemados)

Para acompañar la voz, mostrar estos textos sincronizados:

| Tiempo | Texto en pantalla |
|---|---|
| 0:00 – 0:05 | "MAYO · MES DE LAS MADRES 💐" |
| 0:05 – 0:09 | "Celebrémoslas como se merecen" |
| 0:09 – 0:17 | **"10% OFF"** + nombre de productos |
| 0:17 – 0:25 | **"20% OFF"** + nombre de productos |
| 0:25 – 0:33 | **"30% OFF"** + nombre de productos |
| 0:33 – 0:40 | "Solo en mayo · D'Bella te espera" |

---

## 📱 Caption para el post (Instagram / Facebook / TikTok)

> 💐 **Mayo es el mes de mamá… y D'Bella la consiente.** 💐
>
> Este Día de las Madres tenemos descuentos pensados para que le regales lo que ella merece:
>
> 🌸 10% OFF en productos seleccionados
> 💖 20% OFF en favoritos imperdibles
> 💎 30% OFF en piezas especiales
>
> Porque ninguna como ella, y ningún regalo como el tuyo.
> Ven, escoge y sorpréndela este mayo. ✨
>
> 📍 Visítanos en tienda
> 📲 Pide por WhatsApp
>
> #DiaDeLasMadres #MayoDBella #RegaloParaMama #SurtiCosmeticosDBella #BellezaConAmor #MamaMereceLoMejor

---

## 💬 Tres frases alternativas para Stories sueltas

1. > "💐 Mayo es de mamá… y los descuentos también. Te esperamos en D'Bella."
2. > "Este Día de las Madres, regálale algo que la haga sentir única. 30% OFF solo este mes 💖"
3. > "Mamá no se cansa de darte… ¿qué tal si esta vez la sorprendes tú? 🎁 D'Bella, mes de las madres."

---

## 🎬 Recomendaciones de producción visual

- **Locación visual:** fondo claro/rosa pastel para 10%, vibrante para 20%, dorado/púrpura para 30% — el ojo asocia color con valor.
- **Insertar imágenes emocionales** entre escenas: una madre sonriendo, manos entrelazadas, un abrazo (de banco de imágenes o propio).
- **Rotular cada producto** con su nombre y el porcentaje en una etiqueta tipo "tag" que entra desde la esquina.
- **Cierre con sello dorado:** "Mes de las Madres · D'Bella 2026" para reforzar la temporalidad.
- **Subtítulos quemados obligatorios** — la mayoría ve sin audio.
- **Música sugerida:** instrumental tipo "Mother's Day emotional" de la biblioteca de Reels (sin derechos de autor). Que suba la intensidad justo cuando la voz dice *"TREINTA por ciento de descuento"*.

---

## ✅ Checklist antes de pegar en ElevenLabs

- [ ] Modelo seleccionado: **Multilingual v2** (no v3)
- [ ] Voz elegida: Mariana / Valentina / Sofia (o equivalente cálida femenina latina)
- [ ] Speaker Boost activado
- [ ] Sliders ajustados según el bloque que vas a generar
- [ ] Texto del bloque copiado SIN etiquetas `[…]` (este archivo ya las omite)
- [ ] Productos `PRODUCTO 1`…`PRODUCTO 6` reemplazados por nombres reales
- [ ] Generar 3–5 veces y descargar la mejor toma
- [ ] Repetir para cada bloque por separado
- [ ] Unir audios en CapCut/Premiere con la música y los subtítulos
