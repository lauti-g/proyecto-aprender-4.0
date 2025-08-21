//primero importamos todo lo necesario para crear las rutas, validarlas y encriptar las contraseñas
import app from "express";
const router = app.Router();
import { Op } from "sequelize";
import usuarios from "../models/users.js";
import {
    registrarUsuarioSchema,
    cambiarNombreDeUsuarioSchema,
} from "../../zodSchema.js";
import z from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";

//creamos las rutas que van a ser utilizadas en la aplicación, empezamos con el verbo GET para las páginas principales
//la ruta raíz que renderiza la página de inicio
router.get("/", (req, res) => {
    res.status(200).render("inicio");
});

//la ruta que renderiza la página de registrarse
router.get("/registrarse", (req, res) => {
    res.status(200).render("registrarse");
});

//la ruta que renderiza la página de iniciar sesión
router.get("/iniciarSesion", (req, res) => {
    res.status(200).render("iniciarSesion");
});


function esUsuario(req, res, next) {
    //RECIBIMOS EL TOKEN 
    const token = req.cookies.token;
    const verificacion = jwt.verify(token, process.env.JWTPassword, (err, decoded) => {
        if (err) {
            return res.status(401).send("Token inválido");
        } else {
            req.usuario = decoded;
            console.log(req.usuario);
            next();
        }
    });
}



function esAdmin(req, res, next) {
    //RECIBIMOS EL TOKEN 
    const token = req.cookies.token;
    const verificacion = jwt.verify(token, process.env.JWTPassword, (err, decoded) => {
        if (err) {
            return res.status(401).send("Token inválido");
        } else {
            req.usuario = decoded;
            console.log(req.usuario);
            req.usuario.rol === "administrador" ? next() : res.status(403).send("No tienes permisos para acceder a esta página");
        }
    });
}

//la ruta que renderiza la página de mi perfil
router.get("/miPerfil", esUsuario, (req, res) => {
    res.status(200).render("miPerfil");
});

router.get("/panelAdministrativo", esAdmin, (req, res) => {
    res.status(200).render("panelAdministrativo");
});

//esta es la ruta post que se encarga de registrar al usuario
router.post("/registrarse", async (req, res) => {
    try {
        //se busca en la base de datos si ya existe un usuario con el mismo nombre de usuario o email
        const viejosDatos = await usuarios.findOne({
            where: {
                [Op.or]: [
                    { nombreDeUsuario: `${req.body.nombreDeUsuario}` },
                    { email: `${req.body.email}` },
                ],
            },
            raw: true,
        });

        //si alguno de los dos no es null, significa que ya existe un usuario con ese nombre de usuario o email
        //y se envía un mensaje de error correspondiente
        if (viejosDatos !== null) {
            throw res.status(409).send("email o nombre de usuario en uso");
        }

        //si ambos son null, significa que no hay conflictos y se puede continuar con el registro
        else {
            //convertimos la edad a número para que pase la validación del esquema debido a que los datos del formulario llegan como strings
            req.body.edad = Number(req.body.edad);

            //validamos los datos del formulario con el esquema de zod
            await registrarUsuarioSchema.parse(req.body);

            //reescribimos la contraseña en el body con la contraseña encriptada para guardarla en la base de datos
            req.body.contraseña = await bcrypt.hash(
                `${req.body.contraseña}`,
                10
            );

            //usamos bcrypt para comparar las contraseñas
            const resultado = await bcrypt.compare(
                `${req.body.confirmarContraseña}`,
                `${req.body.contraseña}`
            );

            //si las contraseñas coinciden, se crea el usuario en la base de datos y se renderiza la vista de mi perfilcon los datos del usuario
            if (resultado) {
                //creamos el usuario en la base de datos
                await usuarios.create(req.body);
                //obtenemos datos del usuario recién creado para generar el token
                const usuario = await usuarios.findOne({
                    where: { nombreDeUsuario: `${req.body.nombreDeUsuario}` },
                    raw: true,
                    attributes: ["id", "nombreDeUsuario", "rol"],
                });


                //creamos el token con el id del usuario y lo firmamos con una clave secreta
                const token = await jwt.sign(
                    {
                        "sub": `${usuario.id}`,
                        "name": `${usuario.nombreDeUsuario}`,
                        "rol": `${usuario.rol}`
                    },
                    `${process.env.JWTPassword}`,
                    { expiresIn: '1h' }
                );

                // guardar token en cookie HTTP-only y redirigir al perfil protegido
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 1000 * 60 * 60 // 1 hora
                });
                //rendirijimos la vista a mi perfil
                res.status(200).redirect(`miPerfil`);
            } else {
                //si las contraseñas no coinciden, se envía un mensaje de error
                res.status(400).send("no coinciden las contraseñas");
            }
        }

        //si hay algún error en la validación, se envía un mensaje de error
    } catch (error) {
        //si el error es de zod, se envía el mensaje de error correspondiente
        if (error instanceof z.ZodError) {
            //accedemos al primer error del array de errores y enviamos su mensaje, que es el mesanje que configuramos en el esquema de zod
            throw res.status(400).send(error.issues[0].message);
        } else {
            //si no es de zod el error, se muestra el error en la consola
            console.log(error);
            res.status(500).send("error en el servidor");
        }
    }
});

//esta es la ruta post que se encarga de iniciar sesión
router.post("/iniciarSesion", async (req, res) => {
    //buscamos el usuario en la base de datos por su nombre de usuario y obtenemos su nombre de usuario, contraseña e id
    const usuario = await usuarios.findOne({
        where: { nombreDeUsuario: `${req.body.nombreDeUsuario}` },
        raw: true,
        attributes: ["nombreDeUsuario", "contraseña", "id", "rol"],
    });

    //si el usuario no existe, se envía un mensaje de error
    if (usuario === null) {
        throw res.status(400).send("nombre de usuario no existe");
    }

    //si el usuario existe, se compara la contraseña ingresada con la contraseña encriptada en la base de datos
    //usamos bcrypt para comparar las contraseñas
    const coincidencia = await bcrypt.compare(
        `${req.body.contraseña}`,
        `${usuario.contraseña}`
    );

    //si las contraseñas no coinciden, se envía un mensaje de error
    if (!coincidencia) {
        throw res.status(400).send("contraseña incorrecta");
    }


                //creamos el token con el id del usuario y lo firmamos con una clave secreta
                const token = await jwt.sign(
                    {
                        "sub": `${usuario.id}`,
                        "name": `${usuario.nombreDeUsuario}`,
                        "rol": `${usuario.rol}`
                    },
                    `${process.env.JWTPassword}`,
                    { expiresIn: '1h' }
                );

                // guardar token en cookie HTTP-only y redirigir al perfil protegido
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 1000 * 60 * 60 // 1 hora
                });
                //rendirijimos la vista a mi perfil
                res.status(200).redirect(`miPerfil`);
});

//esta es la ruta put que se encarga de cambiar el nombre de usuario
router.put("/cambiarNombreDeUsuario", async (req, res) => {
    try {
        //validamos que el nuevo nombre de usuario cumpla con las reglas del esquema(mínimo 3 caracteres, máximo 20, sin espacios)
        await cambiarNombreDeUsuarioSchema.parse(req.body);

        //si hay un error en la validación, se envía un mensaje de error
    } catch (error) {
        //si el error es de zod, se envía el mensaje de error correspondiente
        if (error instanceof z.ZodError) {
            throw res.status(400).send(error.issues[0].message);
        } else {
            //si no, se muestra el error en la consola
            console.log(error);
            throw res.status(500).send("error en el servidor");
        }
    }

    //buscamos el usuario en la base de datos por su nombre de usuario y obtenemos su nombre de usuario, contraseña y id
    const viejoNombreDeUsuarioYContraseña = await usuarios.findOne({
        where: { nombreDeUsuario: `${req.body.nombreDeUsuario}` },
        attributes: ["nombreDeUsuario", "contraseña"],
        raw: true,
    });

    //si el usuario no existe, se envía un mensaje de error
    if (viejoNombreDeUsuarioYContraseña === null) {
        throw res.send("nombre de usuario inexistente");
    }

    //si el usuario existe, se compara la contraseña ingresada con la contraseña encriptada en la base de datos
    //usamos bcrypt para comparar las contraseñas
    const compararContraseñas = await bcrypt.compare(
        `${req.body.contraseña}`,
        `${viejoNombreDeUsuarioYContraseña.contraseña}`
    );

    //si las contraseñas no coinciden, se envía un mensaje de error
    if (!compararContraseñas) {
        throw res.status(400).send("contraseña incorrecta");
    }

    //si las contraseñas coinciden, se actualiza el nombre de usuario en la base de datos

    //usamos el método update de sequelize para actualizar el nombre de usuario
    await usuarios.update(
        { nombreDeUsuario: `${req.body.nuevoNombreDeUsuario}` },
        { where: { nombreDeUsuario: `${req.body.nombreDeUsuario}` } }
    );

    //buscamos el nuevo nombre de usuario en la base de datos para renderizarlo en la vista
    //como la base de datos nos devuelve un objeto, hay que acceder a la propiedad
    const nuevoNombreDeUsuarioO = await usuarios.findOne({
        where: { nombreDeUsuario: `${req.body.nuevoNombreDeUsuario}` },
        attributes: ["nombreDeUsuario"],
        raw: true,
    });
    const nuevoNombreDeUsuario = nuevoNombreDeUsuarioO.nombreDeUsuario;

    //renderizamos la vista de nuevo nombre de usuario con el nuevo nombre de usuario
    //esta vista es una página de confirmación que muestra el nuevo nombre de usuario
    res.status(200).render("nuevoNombreDeUsuario", {
        nuevoNombreDeUsuario,
    });
});

//esta es la ruta delete que se encarga de borrar un usuario
router.delete("/borrarUsuario", async (req, res) => {
    //buscamos el usuario en la base de datos por su nombre de usuario y obtenemos su nombre de usuario, contraseña y id
    const usuario = await usuarios.findOne({
        where: { nombreDeUsuario: `${req.body.nombreDeUsuario}` },
        raw: true,
        attributes: ["nombreDeUsuario", "contraseña", "id"],
    });

    //si el usuario no existe, se envía un mensaje de error
    if (usuario === null) {
        throw res.status(400).send("el usuario no existe");
    }

    //si el usuario existe, se compara la contraseña ingresada con la contraseña encriptada en la base de datos
    //usamos bcrypt para comparar las contraseñas
    const coincidencia = await bcrypt.compare(
        `${req.body.contraseña}`,
        `${usuario.contraseña}`
    );

    //si las contraseñas no coinciden, se envía un mensaje de error
    if (!coincidencia) {
        throw res.status(400).send("contraseña incorrecta");
    }

    //si las contraseñas coinciden, se borra el usuario de la base de datos

    //usamos el método destroy de sequelize para borrar el usuario
    await usuarios.destroy({ where: { id: `${usuario.id}` } });
    res.status(200).send("usuario borrado");
});

//exportamos el router para que pueda ser utilizado en otros archivos
//esto es necesario para que las rutas puedan ser utilizadas en el archivo principal de la aplicación
export default router;
