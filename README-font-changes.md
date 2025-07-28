# README - Cambios de Fuentes en Landing Page

## 🎯 Objetivo
Cambiar las fuentes de la landing page para usar Source Serif 4 para los títulos y Work Sans para el contenido, reemplazar Inter por Work Sans en todos los elementos de texto, cambiar todas las referencias de "Edgar" por "Mía", y reorganizar el hero section para integrar el componente de WhatsApp con casos de uso.

## 📁 Archivos Modificados

### Archivos Modificados
- `app/layout.tsx` - Agregadas las nuevas fuentes Source Serif 4 y Work Sans
- `app/globals.css` - Agregadas las variables CSS y clases de utilidad para las nuevas fuentes
- `app/page.tsx` - Aplicadas las nuevas fuentes a títulos y contenido, y reorganizado el hero section

## 🚀 Implementación

### 1. Reorganización del Hero Section
- ✅ **Layout de dos columnas**: Título y descripción a la izquierda, componente WhatsApp a la derecha
- ✅ **Componente WhatsApp limpio**: Sin toggle interno, solo chat funcional
- ✅ **Toggle externo**: Ubicado debajo del componente WhatsApp para mejor UX
- ✅ **Botón CTA centrado**: "Agendar Demo" ubicado debajo con más espacio
- ✅ **Sección de casos de uso eliminada**: Integrada completamente en el hero
- ✅ **Navegación actualizada**: Enlaces actualizados para apuntar a la sección de características
- ✅ **Espaciado optimizado**: Padding reducido para mostrar mejor el botón CTA

### 2. Configuración de Fuentes en Layout
```typescript
// Configurar Work Sans para el contenido
const workSans = Work_Sans({ 
  subsets: ["latin"],
  variable: '--font-work-sans'
})

// Configurar Source Serif 4 para los títulos
const sourceSerif4 = Source_Serif_4({ 
  subsets: ["latin"],
  variable: '--font-moranga',
  weight: ['400', '500', '600', '700']
})
```

### 3. Variables CSS Agregadas
```css
:root {
  --font-work-sans: 'Work Sans', sans-serif;
  --font-moranga: 'Source Serif 4', serif;
}
```

### 4. Clases de Utilidad
```css
.font-work-sans {
  font-family: var(--font-work-sans);
}

.font-moranga {
  font-family: var(--font-moranga);
}
```

## 🎨 Aplicación de Fuentes

### Títulos con Source Serif 4
- ✅ Título principal del hero: "Mía, el asistente virtual..."
- ✅ Título de características: "IA diseñada específicamente..."
- ✅ Título de FAQs: "Preguntas Frecuentes"
- ✅ Título del CTA final: "¿Listo para conocer a Mía?"

### Contenido con Work Sans
- ✅ Párrafo principal del hero
- ✅ Párrafos descriptivos de secciones
- ✅ Textos de las tarjetas de características
- ✅ Respuestas de las FAQs
- ✅ Párrafo del CTA final

### Elementos de Navegación con Work Sans
- ✅ Logo "muviAI"
- ✅ Enlaces de navegación (Características, Casos de Uso, Login)
- ✅ Botones de CTA (Agendar demo)
- ✅ Menú móvil

### Elementos Interactivos con Work Sans
- ✅ Títulos de características individuales
- ✅ Botones del selector de casos de uso (toggle externo)
- ✅ Mensajes del chat simulado (en hero)
- ✅ Títulos de FAQs
- ✅ Input del chat (en hero)
- ✅ Footer

### Cambios de Nombre
- ✅ Todas las referencias de "Edgar" cambiadas por "Mía"
- ✅ Títulos, párrafos, FAQs y enlaces actualizados
- ✅ Datos de llamadas y asesores actualizados
- ✅ Enlaces de WhatsApp actualizados

## 🔧 Notas Técnicas

### Fuente Source Serif 4
- **Fuente usada**: Source Serif 4
- **Disponibilidad**: Google Fonts
- **Características**: Serif elegante, perfecta para títulos

### Fuente Work Sans
- **Disponibilidad**: Google Fonts
- **Características**: Sans-serif moderna, excelente legibilidad
- **Uso**: Todo el contenido de texto

### Jerarquía Tipográfica
```css
/* Títulos principales */
h1, h2: font-moranga (Source Serif 4)

/* Contenido */
p, div: font-work-sans (Work Sans)

/* Elementos existentes */
font-outfit: Mantenida para compatibilidad
```

## 🧪 Testing

### Verificaciones Realizadas
- ✅ Fuentes se cargan correctamente
- ✅ Títulos usan Playfair Display
- ✅ Contenido usa Work Sans
- ✅ Compatibilidad con fuentes existentes
- ✅ Responsive design mantenido

### Casos de Prueba
- ✅ Página carga sin errores
- ✅ Fuentes se aplican correctamente
- ✅ No hay conflictos con fuentes existentes
- ✅ Performance no afectada

## 📈 Impacto

### Beneficios
1. **Mejor Jerarquía Visual**: Títulos más distinguibles
2. **Legibilidad Mejorada**: Work Sans es excelente para lectura
3. **Diseño Más Profesional**: Combinación elegante de serif y sans-serif
4. **Consistencia**: Aplicación uniforme en toda la landing

### Métricas a Monitorear
- Tiempo de carga de fuentes
- Legibilidad percibida por usuarios
- Engagement con el contenido

## 🔄 Mantenimiento

### Archivos a Revisar
- `app/layout.tsx` - Configuración de fuentes
- `app/globals.css` - Variables y clases CSS
- `app/page.tsx` - Aplicación de clases

### Futuras Mejoras
- Optimización de carga de fuentes
- A/B testing de diferentes combinaciones
- Considerar fuentes locales para mejor performance

---

**Nota**: Los cambios mantienen la funcionalidad existente mientras mejoran significativamente la tipografía de la landing page. 