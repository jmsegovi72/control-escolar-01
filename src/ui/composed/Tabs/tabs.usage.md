# Tabs

Navegacion por pestanas para dividir informacion relacionada sin cambiar de pantalla.

## Cuando Usarlo

- Expediente de alumno: datos, documentos, calificaciones, historial.
- Configuracion con secciones.
- Vistas de detalle donde hay varios bloques del mismo registro.

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `items` | `TabItem[]` | Lista de pestanas. |
| `activeTab` | `string` | Id de la pestana activa. |
| `variant` | `line \| contained \| pills` | Estilo visual. |
| `size` | `sm \| md \| lg` | Tamano de las pestanas. |
| `orientation` | `horizontal \| vertical` | Direccion del listado. |
| `fullWidth` | `boolean` | Reparte el ancho entre pestanas. |

## Item

```ts
type TabItem = {
  id: string;
  label: string;
  icon?: IconIntent;
  badge?: string | number;
  disabled?: boolean;
};
```

## Ejemplo

```tsx
<Tabs
  activeTab="grades"
  items={[
    { id: "profile", label: "Datos", icon: "person" },
    { id: "grades", label: "Calificaciones", icon: "class" },
    { id: "documents", label: "Documentos", icon: "download", badge: 3 },
  ]}
>
  <Panel title="Calificaciones">Contenido...</Panel>
</Tabs>
```

## Criterio

`Tabs` no decide que contenido mostrar ni maneja rutas. La app real controla `activeTab` y cambia el contenido. Este componente solo representa la navegacion visual y el panel activo.
