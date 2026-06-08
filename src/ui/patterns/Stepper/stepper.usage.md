# Stepper

Indicador de progreso para procesos largos.

## Cuando Usarlo

- Inscripcion o reinscripcion.
- Alta de alumno.
- Revision documental.
- Carga masiva por CSV.
- Configuracion inicial.

## Props

| Prop | Tipo | Uso |
| --- | --- | --- |
| `steps` | `StepperStep[]` | Lista de pasos. |
| `activeStep` | `string` | Paso activo cuando no se pasa `status` manual. |
| `orientation` | `horizontal \| vertical` | Direccion visual. |
| `size` | `sm \| md` | Densidad visual. |

## Step

```ts
type StepperStep = {
  id: string;
  label: string;
  description?: string;
  status?: "complete" | "current" | "pending" | "error";
  icon?: IconIntent;
};
```

## Ejemplo

```tsx
<Stepper
  activeStep="documents"
  steps={[
    { id: "student", label: "Datos del alumno" },
    { id: "tutor", label: "Tutor" },
    { id: "documents", label: "Documentos" },
    { id: "review", label: "Revision" },
  ]}
/>
```

## Criterio

`Stepper` solo representa progreso. La app real controla el paso actual, errores, validaciones y navegacion.
