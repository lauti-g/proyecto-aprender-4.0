//primero obtenemos las rutas del controlador
import routes from '../controllers/controllers.js'


//manejamos las rutas de la aplicación que vienen del controlador
routes.get('/', routes)
routes.get('/registrarse', routes)
routes.post('/registrarse', routes)
routes.get('/iniciarSesion', routes)
routes.post('/iniciarSesion', routes)
routes.put('/cambiarNombreDeUsuario', routes)
routes.delete('/borrarUsuario', routes)



// exportamos las rutas para que puedan ser utilizadas en otros archivos
export default routes