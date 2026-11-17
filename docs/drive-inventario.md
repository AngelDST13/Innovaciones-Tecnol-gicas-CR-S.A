# Inventario de Google Drive · documentos de política

Registro de los archivos subidos a Drive para el pipeline de ingesta. Los IDs no son secretos, pero el acceso sí: la cuenta de servicio es la única que puede leer la carpeta, y su llave JSON nunca se versiona.

- **Proyecto de Google Cloud:** `innovaciones-cr-mp2` (Drive API habilitada)
- **Carpeta:** `Politicas-Innovaciones-CR`
- **ID de la carpeta:** `1zqfZovfFTkEdgVt9aqmiI8Zj2poE0hod`
- **Cuenta de servicio:** `drive-pipeline-reader@innovaciones-cr-mp2.iam.gserviceaccount.com` (Lector)
- **Acceso:** privado. Ningún archivo tiene enlace público.

| Archivo original | Nombre en Drive | Formato | ID del archivo | Verificado |
|---|---|---|---|---|
| 01-vacaciones-y-feriados.md | POL-01 Vacaciones y feriados v2.1.pdf | PDF | `1IMmOkpYcLfFw4FhDORz4ATjLTchwC95o` | Sí |
| 02-permisos-y-licencias.md | POL-02 Permisos y licencias v1.4 | Google Doc | `1PC-JTbZhi_RrWVMKZINBfS1gaspHeYs36p6N77OKFTg` | Sí |
| 03-incapacidades.md | POL-03 Incapacidades v1.2 | Google Doc | `1BCKBwHElBzZz4a9IkRC_x96HMfSC3U1aJ13OCZBOcIo` | Sí (pendiente: duda reportada en la tabla) |
| 04-jornada-y-asistencia.md | POL-04 Jornada y asistencia v1.3.pdf | PDF | `1B_o6F0sM6zVVrxY9ARR50fHafQvR1MO8` | Sí |
| 05-remuneracion-y-pagos.md | POL-05 Remuneración y pagos v2.0 | Google Doc | `1so5QujLykAzQEUOCAlBFIQwHmcDA7x7HEbcE9Zt0kx0` | Sí |
| 06-beneficios.md | POL-06 Beneficios v1.1.pdf | PDF | `1usnriUASEs3vx65Sq-hXKME44teWxrey` | Sí |
| 07-ingreso-y-salida.md | POL-07 Ingreso y salida v1.2 | Google Doc | `1w_eoVdWgKrItgUidC15xJbbWFfS1oB7lclUj_EsXhjs` | Sí |
| 08-desempeno-y-carrera.md | POL-08 Desempeño y carrera v1.0 | Google Doc | `1872tThuFsLuqlDSQw-SKiX9yeY-F-xVS3rXbczZK6_s` | Sí |
| 09-conducta-y-convivencia.md | POL-09 Conducta y convivencia v1.1 | Google Doc | `1s8TeCkwpwFbjXz0AxRdRwDDM6ky1KDOODGieJOGbUUc` | Sí |
| 10-datos-y-privacidad.md | POL-10 Datos y privacidad v1.0 | Google Doc | `1AiyEGZVZ3XX2fEEWPR9s4rFDx8A4V1circA8rSKjZi8` | Sí |
| calendario-2026.csv | POL-CAL Calendario de feriados y pagos 2026 | Google Sheets | `1OE-D3EULn2dmRcu_zMC_TX6ZJSyYg7CfngbTKPcxe3o` | Sí (35 filas, 4 columnas) |

## Pendientes antes de la ingesta

1. **Llave JSON de la cuenta de servicio**, guardada fuera del repositorio. Su ruta va en `backend/.env` como `GOOGLE_APPLICATION_CREDENTIALS`.
2. **Duda de POL-03**, reportada en la verificación. Revisar la tabla de incapacidades contra `docs/politicas/03-incapacidades.md`.
3. **Tratamiento de formatos.** Los Google Docs se exportan a texto plano; los PDF se extraen con un lector de PDF. Ambos deben conservar el bloque de metadatos al inicio, porque el agente cita por documento y versión.
