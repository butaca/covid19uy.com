# Coronavirus COVID-19 en Uruguay

[![Netlify Status](https://api.netlify.com/api/v1/badges/c50f5a55-4199-4886-8eb9-971a690d145d/deploy-status)](https://app.netlify.com/sites/covid19uy/deploys)

## Introducción

Repositorio del sitio [https://covid19uy.com/](https://covid19uy.com).

El sitio usa HTTPS 🔒 y es estático, gratis y no tiene publicidad. Fue creado desinteresadamente, su único propósito es ayudar.

Usa información **oficial, pública y verificable** del MSP publicada por SINAE.

Cuenta con el apoyo de Netlify en su [programa de ayuda a sitios sobre COVID-19](https://www.netlify.com/blog/2020/03/22/coronavirus/covid-19-support/).

## Información técnica

* El sitio es estático, generado con [Hugo](https://gohugo.io).
* Utiliza [Bulma](https://bulma.io) para estilos y layout.
* La simulación utiliza [PixiJS](https://pixijs.download).
* El sistema de build es [Gulp](https://gulpjs.com).

### Datos

DATA = assets/js/data/

#### Datos ingresados manualmente

* Los datos de Uruguay se obtienen de los informes diarios del [MSP](https://www.gub.uy/ministerio-salud-publica/coronavirus) [reportados por SINAE](https://www.gub.uy/sistema-nacional-emergencias/comunicacion/comunicados/) y se ingresan de manera manual en el archivo `[DATA]/uruguay.json`.
* En en archivo `[DATA]/uruguayDeaths.json` se van registrando los fallecimientos.
* Los datos sobre ocupación de camas de CTI, se ingresan manualmente, usando los informes diarios del [SUMI](https://sumi.uy) y se guardan en `[DATA]/icu.json`.

#### Datos descargados automáticamente durante el build

* Los datos los departamentos de Uruguay (`[DATA]/uruguayDepartments.json`) se descargan del [visualizador del SINAE](https://www.gub.uy/sistema-nacional-emergencias/pagina-embebida/visualizador-casos-coronavirus-covid-19-uruguay) 
* Los datos de vacunación de Uruguay (`[DATA]/uruguayVaccination.json`) se descargan del [monitor de vacunación del MSP](https://monitor.uruguaysevacuna.gub.uy)
* Los datos del mundo y la región (`[DATA]/world.json`, `[DATA]/region.json` y `[DATA]/worldPopulation.json`) se descargan automáticamente durante el build de diversas fuentes.

### Cómo desarrollar

1. Instalar [npm](https://www.npmjs.com), [Hugo](https://gohugo.io) y [Gulp](https://gulpjs.com).
2. Instalar dependencias con `npm i`.
3. Correr un servidor local con `gulp develop`
4. Happy coding!

#### Branches

Como por ahora hay un único de desarrollador, se utiliza un esquema de branches simple:

* `master`: Branch de producción
* `develop`: Branch de desarrollo

Cuando un feature lleva mucho tiempo de desarrollo, se crea un branch dedicado para el feature. Por ejemplo:

* `sim`: Simulador.
* `region`: Comparaciones con otros países de la región.

### Deploy

El sitio está hosteado en [Netlify](http://netlify.com/) y cada vez que se hace un push en master se dispara un build en forma automática. También se realiza un build cada 1 hora para actualizar los datos del mundo y la región.
