# Búsqueda Global

La aplicación incluye una barra de búsqueda (en `HomeAdmiPage`) que permite consultar simultáneamente:
- Tickets (título, descripción y por ID exacto si el término es numérico)
- Usuarios (nombre completo, username, correo)
- Categorías (nombre)
- Grupos (nombre)

## Uso
1. Escribe al menos 2 caracteres.
2. Los resultados aparecen automáticamente (debounce 400ms).
3. Haz clic en un ticket para navegar a su vista de solución.
4. Otros tipos (usuarios, categorías, grupos) se muestran informativos (se puede ampliar en el futuro para navegación específica).
5. Botón "Limpiar" restablece el panel.

## Endpoint Backend
`GET /usuarios/buscar?q=valor`

Respuesta ejemplo:
```
{
  "success": true,
  "query": "impresora",
  "results": {
    "tickets": [{"id":12,"titulo":"Impresora no imprime","estado":"en curso",...}],
    "usuarios": [{"id":3,"nombre_completo":"Juan Pérez",...}],
    "categorias": [{"id":2,"nombre":"Hardware"}],
    "grupos": []
  },
  "counts": {"tickets":1,"usuarios":1,"categorias":1,"grupos":0},
  "took_ms": 7.41
}
```

## Notas Técnicas
- Límite: 10 resultados por entidad.
- LIKE `%q%` básico; si `q` es numérico se intenta coincidencia exacta de ID de ticket.
- Sin paginación (se puede ampliar con parámetros `limit` y `offset`).
- Retorna `success=true` incluso cuando no hay resultados (counts=0).

## Mejoras Futuras Sugeridas
- Resaltar coincidencias (highlight) en frontend.
- Acción para usuarios (abrir perfil) y categorías/grupos (filtro de tickets).
- Paginación e índice FULLTEXT para escalar.
- Cache de consultas recientes (localStorage) para sugerencias.
