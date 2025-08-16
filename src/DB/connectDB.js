//primero importamos las variables de entorno desde un archivo .env
import 'dotenv/config' 
//importamos sequelize desde la librería sequelize
import { Sequelize } from "sequelize";

//creamos una instancia de sequelize para conectarnos a la base de datos
const sequelize = new Sequelize({
    //usamos dotenv para cargar las variables de entorno desde un archivo .env
    password: process.env.DB_contrasena,
    username: process.env.DB_usuario,
    database: process.env.DB_baseDeDatos,
    host: process.env.DB_host,
    dialect: "mysql"
});


//probamos la conexión a la base de datos (por si acaso)
/*(async()=>{
    try {
        await sequelize.authenticate()
        console.log("anda")
    } catch (error) {
        console.error(error)
    }
    
})()*/



//exportamos sequelize para que pueda ser utilizado en otros archivos
export default sequelize