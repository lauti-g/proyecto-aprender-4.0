//primero importamos sequelize para definir el modelo de usuarios
import { DataTypes } from "sequelize";
import sequelize from "../DB/connectDB.js";


//definimos el modelo de usuarios
const usuarios = sequelize.define('usuarios',{


    //definimos los campos del modelo
    //cada campo tiene un tipo de dato y algunas validaciones
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombreDeUsuario:{
        type: DataTypes.STRING,
        allowNull: false,
        unique:true,
        validate:{
            notEmpty: true,
            len: [3, 20]
        }
    },
    email:{
        type: DataTypes.STRING,
        allowNull:false,
        unique: true,
        validate:{
            isEmail:true,
            notEmpty: true,
            len:[4, 100]
        }
    },
    genero:{
        type: DataTypes.STRING,
        allowNull:false,
        validate:{
            notEmpty: true,
        }
    },
    edad:{
        type: DataTypes.INTEGER,
        allowNull:false,
        validate:{
            min: 18,
            notEmpty:true
        }
    },
    contraseña:{
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            notEmpty: true,
            len:[5,100]
        }
    }
})


//sincronizamos el modelo con la base de datos
//esto creará la tabla si no existe o actualizará la tabla si ya existe
export default usuarios