# TODO — JS Restaurant (learn-to-code game)

## Concepto
Juego estilo "The Farmer Was Replaced" donde el jugador aprende JavaScript
automatizando un robot mesero en un bar. Progresion gradual de conceptos.

## Motor de ejecucion (PRIORITARIO)
- [x] Editor CodeMirror funcional con Tab
- [x] Motor que ejecuta codigo del editor como JS real
- [x] Ejecucion secuencial sin await (se encadenan internamente)
- [x] Objeto `robot` con metodos habilitables/deshabilitables
- [x] Contexto automatico: robot sabe con que customer/cocktail trabaja
- [x] Customers spawneando solos con mesas y pedidos aleatorios
- [x] Highlighting de linea en ejecucion
- [x] Manejo de errores basico (catch + mostrar al usuario)

## Progresion de niveles (DISEÑO PENDIENTE)
- [x] clientes viniendo desde el comienzo y no cuando tocamos en run.
- [x] Nivel 1: acciones basicas (1-2 funciones). Se ejecuta UNA vez por RUN
- [x] Ventana de hints.
- [x] Nivel 2: desbloquear `while` — automatizacion
- [x] Nivel 3: desbloquear `if/else` — toma de decisiones
- [ ] Nivel 4+: funciones avanzadas (takeOrder, makeCocktail, etc.)

## Tienda / Firmware Updates
- [x] Sistema de dinero (ya existe parcialmente)
- [ ] Tienda con "arbol de conceptos" desbloqueables con dinero
- [x] Narrativa: "Firmware update" del robot para nuevas capacidades
- [x] El editor rechaza keywords/funciones no desbloqueadas
- [x] BUG: while no spawnea automaticamente clientes

## Manejo de errores (2 fases)
### Fase 1 (MVP)
- [x] Pop-up emergente con mensaje de error simplificado
- [ ] Boton "pedir consejo" para ayuda contextual

### Fase 2 (desbloqueable)
- [ ] Terminal/consola como upgrade del firmware
- [ ] Errores reales (stack trace, mensajes JS nativos)
- [ ] Enseñar al jugador a leer y debuggear errores

## Infraestructura
- [ ] Sistema de niveles/progresion
- [ ] Guardado de progreso (localStorage?)
- [ ] Restriccion de funciones por nivel (config escalable)


BUGS

- tenemos que guardar el tutorial en hints.
- Sacar primera funcion del tutorial
- crear tutorial aparte para primera funcion
- ya no tenemos que mostrar el conesjo de que los hints se guardan.

update while:
- al comprar while no comienzan a venir automaticamente

update if/else:
- condicional no se lee primero