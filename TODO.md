# TODO — JS Restaurant (learn-to-code game)

## Concepto
Juego estilo "The Farmer Was Replaced" donde el jugador aprende JavaScript
automatizando un robot mesero en un bar. Progresion gradual de conceptos.

## Motor de ejecucion (PRIORITARIO)
- [x] Editor CodeMirror funcional con Tab
- [ ] Motor que ejecuta codigo del editor como JS real
- [ ] Ejecucion secuencial sin await (se encadenan internamente)
- [ ] Objeto `robot` con metodos habilitables/deshabilitables
- [ ] Contexto automatico: robot sabe con que customer/cocktail trabaja
- [ ] Customers spawneando solos con mesas y pedidos aleatorios
- [ ] Manejo de errores basico (catch + mostrar al usuario)

## Progresion de niveles (DISEÑO PENDIENTE)
- [ ] Nivel 1: acciones basicas (1-2 funciones). Se ejecuta UNA vez por RUN
- [ ] Nivel 2: mas funciones, secuencias mas largas
- [ ] Nivel 3: desbloquear `while` — automatizacion
- [ ] Nivel 4: desbloquear `if/else` — toma de decisiones
- [ ] Nivel 5+: funciones avanzadas (takeOrder, makeCocktail, etc.)

### Problema abierto: primer nivel
- Debe tener sentido narrativo (no limpiar 10 veces una mesa limpia)
- La accion repetitiva debe justificar la necesidad del `while`
- Los clientes llegan → ensucian mesas → necesitas limpiar → negocio crece → necesitas while

## Tienda / Firmware Updates
- [ ] Sistema de dinero (ya existe parcialmente)
- [ ] Tienda con "arbol de conceptos" desbloqueables con dinero
- [ ] Narrativa: "Firmware update" del robot para nuevas capacidades
- [ ] El editor rechaza keywords/funciones no desbloqueadas

## Manejo de errores (2 fases)
### Fase 1 (MVP)
- [ ] Pop-up emergente con mensaje de error simplificado
- [ ] Boton "pedir consejo" para ayuda contextual

### Fase 2 (desbloqueable)
- [ ] Terminal/consola como upgrade del firmware
- [ ] Errores reales (stack trace, mensajes JS nativos)
- [ ] Enseñar al jugador a leer y debuggear errores

## Infraestructura
- [ ] Sistema de niveles/progresion
- [ ] Guardado de progreso (localStorage?)
- [ ] Restriccion de funciones por nivel (config escalable)
