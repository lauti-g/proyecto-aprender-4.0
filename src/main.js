//importamos el server desde configs.js donde tenemos todas las configuraciones de el mismo
import app from './configs.js'


//iniciamos el servidor en el puerto 3000
//y mostramos un mensaje en la consola para saber que el servidor está corriendo
app.listen(3000)
console.log("server en puerto: 3000")