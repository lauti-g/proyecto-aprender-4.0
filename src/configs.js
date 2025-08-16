//importamos express y otros módulos necesarios
import express from 'express'
import path from 'path'
import 'ejs'
import { fileURLToPath } from 'url';
import routes from "./router/routes.js";


//iniciamos express y configuramos la ruta de las vistas
const config = express()
const dirname = path.dirname(fileURLToPath(import.meta.url))


//configuramos express para que use ejs como motor de plantillas
config.set('views', path.join(dirname, 'views'))
config.set('view engine', 'ejs')


//configuramos express para que lea archivos json y urlencoded
config.use(express.json())
config.use(express.urlencoded({extended:false}))


//le decimos que use routes para manejar las rutas
config.use(routes)


//exportamos config para que pueda ser utilizado en otros archivos
export default config
