# Dashboard - Modo Edición Reestructurado

## Cambios Implementados

### 1. Guardado y Carga Simplificados
- **Antes**: Validaciones, clampings, y normalizaciones automáticas que modificaban posiciones
- **Ahora**: Guardado directo de posiciones exactas del usuario, carga sin modificaciones

### 2. Movimiento de Elementos
- **Antes**: Elementos podían interferir entre sí, bounds automáticos, snap-to-grid forzado
- **Ahora**: Cada elemento se mueve independientemente, sin afectar a otros

### 3. Redimensionamiento
- **Antes**: Límites del container podían cambiar tamaños, validaciones excesivas
- **Ahora**: Solo se respetan minWidth/minHeight, usuario tiene control total

### 4. Persistencia
- **Antes**: Debounce de 120ms, normalizaciones post-guardado
- **Ahora**: Debounce de 50ms, guardado exacto de lo que el usuario configuró

### 5. Reposicionamiento Automático
- **Antes**: ResizeObserver reposicionaba elementos automáticamente
- **Ahora**: Solo mide, nunca reposiciona (excepto al cargar por primera vez)

## Uso

### Modo Edición
1. Click en menú (⋮) arriba derecha
2. "Editar Dashboard"
3. Arrastra elementos por el icono de movimiento (arriba izquierda)
4. Redimensiona usando los handles en los bordes
5. "Guardar Dashboard" para persistir cambios

### Depuración en Consola

Si el layout guardado está corrupto:
```javascript
// Limpiar todo y empezar de cero
window.dashboardComponent.resetAllLayouts()
// Luego recarga la página
```

Ver layout guardado:
```javascript
// Ver elementos
console.log(JSON.parse(localStorage.getItem('dashboard-element-layout')))
// Ver widgets
console.log(JSON.parse(localStorage.getItem('dashboard-widget-layout')))
```

## Logs Importantes

Al mover/redimensionar:
- `onElementChange: <id> <posición>` - Confirma guardado

Al cargar:
- `loadLayout: raw saved` - Muestra JSON guardado
- `applyElementRatios: applied elementSizes` - Posiciones aplicadas

## Solución de Problemas

**Elementos no se guardan**:
- Verifica consola: debe aparecer `onElementChange` al soltar elemento
- Verifica que `doSaveLayout: saved to localStorage` aparezca

**Elementos saltan al recargar**:
- Limpia localStorage y reconfigura
- Verifica que no haya errores en consola durante carga

**Elementos se superponen**:
- Es normal en modo edición - usuario tiene control total
- Reposiciona manualmente según necesites
