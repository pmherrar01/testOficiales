# Examen de Oficiales de Mesa · Baloncesto

Aplicación web (Node/Express + React + MySQL) para practicar el examen de
Oficiales de Mesa de baloncesto (anotador, cronometrador, operador de 24
segundos, comisario/delegado). El banco de preguntas se generó a partir de:

- `OFICIALES.pdf` — banco de preguntas y respuestas oficiales.
- `4_5947109913326001303_260823_215341.pdf` — cambios en las reglas FIBA
  válidos desde el 1 de octubre de 2026.

Solo se incluyen preguntas relevantes para la mesa (tiempos muertos,
sustituciones, faltas y su registro en acta, reloj de partido y de
lanzamiento, posesión alterna, acta del partido, señales de los árbitros
hacia la mesa, Instant Replay, etc.). Se excluyen preguntas de criterio
puramente arbitral de pista.

## Funcionalidad

- Al entrar, eliges cuántas preguntas quieres en el test: **5, 15 o 25**.
- Examen tipo test (4 opciones, 1 correcta), con las opciones en orden
  aleatorio en cada intento.
- Al corregir, se muestra qué has fallado, la respuesta correcta y la
  referencia normativa de cada pregunta.
- **Repaso de fallos**: todas las preguntas que hayas fallado alguna vez se
  acumulan en un test único. En cuanto la respondes bien, sale de esa lista;
  si la sigues fallando, se queda.

## Estructura del proyecto

```
backend/    API Node.js/Express (MySQL vía mysql2)
frontend/   SPA React (Vite)
database/   schema.sql y seed/questions.json (banco de preguntas)
docker-compose.yml   contenedor MySQL para desarrollo/despliegue
```

## Puesta en marcha (en este equipo)

Requisitos: Node.js 20+, Docker (para la base de datos).

1. **Base de datos** (contenedor MySQL propio, en el puerto 3307 para no
   chocar con un MySQL/MariaDB que ya tengas corriendo en 3306):

   ```bash
   ./start-db.sh
   ```

   Este script usa `docker compose` (plugin v2) si está disponible, si no
   `docker-compose` (v1), y si ninguno funciona en el equipo, arranca el
   contenedor con `docker run` directamente. También puedes ejecutar
   `docker compose up -d` a mano si sabes que tu Docker lo soporta.

2. **Backend**:

   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run seed     # carga database/seed/questions.json en MySQL
   npm run dev       # http://localhost:4000
   ```

3. **Frontend** (en otra terminal):

   ```bash
   cd frontend
   npm install
   npm run dev       # http://localhost:5173
   ```

4. Abre `http://localhost:5173`.

Atajo: desde la raíz del proyecto, `npm install --prefix . && npm run
install:all && npm run dev` levanta backend y frontend a la vez (requiere la
base de datos ya arrancada y sembrada como en el paso 1-2).

## Llevarlo a otro equipo

Todo el proyecto (código, `schema.sql` y `database/seed/questions.json`)
está en este directorio/repositorio, así que para practicar desde otro
equipo basta con:

1. Copiar o clonar esta carpeta en el otro equipo.
2. Tener Node.js 20+ y Docker instalados.
3. Repetir los pasos de "Puesta en marcha" de arriba (`./start-db.sh`,
   `npm run seed`, `npm run dev` en backend y frontend).

Como la base de datos se reconstruye desde `schema.sql` +
`database/seed/questions.json` (no se copian ficheros de datos de MySQL),
el banco de preguntas será idéntico en cualquier equipo donde lo instales.

Si prefieres no usar Docker en el otro equipo, puedes usar un MySQL/MariaDB
ya instalado: crea la base de datos con `database/schema.sql` y ajusta las
credenciales en `backend/.env`.

## Regenerar el banco de preguntas

El banco de preguntas se generó automáticamente a partir de los dos PDF con
ayuda de un workflow de extracción y verificación. Si se añaden más PDFs o
hay que revisar preguntas, el JSON intermedio crudo (`database/seed/raw-extracted.json`)
se convierte al formato final con:

```bash
node backend/src/scripts/build-seed.js
```

Esto genera `database/seed/questions.json`, listo para `npm run seed`.
