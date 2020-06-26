# Coronavirus COVID-19 en Uruguay

[![Netlify Status](https://api.netlify.com/api/v1/badges/c50f5a55-4199-4886-8eb9-971a690d145d/deploy-status)](https://app.netlify.com/sites/covid19uy/deploys)

# Introducción 

Repositorio del sitio [https://covid19uy.com/](https://covid19uy.com).

El sitio usa HTTPS 🔒 y es estático, gratis y no tiene publicidad. Fue creado desinteresadamente, su único propósito es ayudar.

Usa información **oficial, pública y verificable** del MSP publicada por SINAE.

## Información técnica

* El sitio es estático, generado con [Hugo](https://gohugo.io).
* Utiliza [Bulma](https://bulma.io) para estilos y layout.
* La simulación utiliza [PixiJS](https://pixijs.download).
* El sistema de build es [Gulp](https://gulpjs.com).

### Datos

Los datos de Uruguay se obtienen de los informes diarios del SINAE y se ingresan de manera manual en el archivo `data/uruguay.json`. En en archivo `data/uruguay-deaths.json` se van registrando los fallecimientos, pero actualmento no se utiliza.

Los datos del mundo y la región (`data/world.json`, `data/region.json` y `data/world-population.json`) se descargan automáticamente durante el build. 

### Cómo desarrollar

1. Instalar [npm](https://www.npmjs.com), [Hugo](https://gohugo.io) y [Gulp](https://gulpjs.com).
2. Correr un servidor local con `gulp develop`
3. Happy coding!

## Deploy

El sitio está hosteado en Netlify y cada vez que se hace un push en master se dispara un build en forma automática. También se realiza un build cada 1 hora para actaulizar los datos del mundo y la región.


