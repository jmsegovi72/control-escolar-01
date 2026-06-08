# FileUpload

Zona visual de carga para documentos individuales y carga masiva por archivo.

## Modos

- `document`: acta, CURP, comprobante, foto, certificado.
- `bulk`: CSV o archivo de carga por lote.

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `label` | `string` | Titulo del bloque. |
| `description` | `string` | Explicacion del archivo esperado. |
| `mode` | `document \| bulk` | Tipo de carga. |
| `accept` | `string` | Formatos permitidos. |
| `multiple` | `boolean` | Permite varios archivos. |
| `disabled` | `boolean` | Bloquea interaccion. |
| `invalid` | `boolean` | Marca estado invalido. |
| `error` | `string` | Mensaje de error. |
| `helpText` | `string` | Ayuda contextual. |
| `maxSizeLabel` | `string` | Texto de tamano maximo. |
| `templateLabel` | `string` | Accion para plantilla CSV. |
| `files` | `FileUploadItem[]` | Archivos seleccionados o cargados. |

## Ejemplo Documento

```tsx
<FileUpload
  mode="document"
  label="Acta de nacimiento"
  accept=".pdf,.jpg,.png"
  maxSizeLabel="hasta 5 MB"
/>
```

## Ejemplo Carga Masiva

```tsx
<FileUpload
  mode="bulk"
  label="Carga masiva de alumnos"
  accept=".csv"
  templateLabel="Descargar plantilla CSV"
  helpText="Incluye matricula, nombre, grupo y estado."
/>
```

## Criterio

Este componente no lee ni sube archivos por si solo. La app real valida formato, procesa CSV, sube documentos y muestra errores de lote.
