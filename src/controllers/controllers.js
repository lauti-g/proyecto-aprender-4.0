//primero importamos todo lo necesario para crear las rutas, validarlas y encriptar las contraseñas
//importamos express y creamos el router
import app from 'express'
const router = app.Router()

//importamos el modelo de usuarios, los esquemas de validación y las librerías necesarias
import usuarios from '../models/users.js'
import {registrarUsuarioSchema, cambiarNombreDeUsuarioSchema} from "../../zodSchema.js";
import z from "zod"
import bcrypt from "bcrypt";






//creamos las rutas que van a ser utilizadas en la aplicación, empezamos con el verbo GET para las páginas principales
//la ruta raíz que renderiza la página de inicio
router.get('/', (req, res)=>{
	res.statusCode(200).render("inicio")
})


//la ruta que renderiza la página de registrarse
router.get('/registrarse', (req, res)=>{
	res.statusCode(200).render("registrarse")
})


//la ruta que renderiza la página de iniciar sesión
router.get('/iniciarSesion', (req, res)=>{
	res.statusCode(200).render("iniciarSesion")
})


//la ruta que renderiza la página de mi perfil
//esta ruta es para que el usuario pueda ver su perfil una vez que se haya registrado o iniciado sesión
//aún no está implementada la lógica para mostrar los datos del usuario, pero se renderiza la vista
router.get('/miPerfil', (req, res)=>{
	res.statusCode(200).render('miPerfil')
})


//esta es la ruta post que se encarga de registrar al usuario
router.post('/registrarse',async (req, res)=>{
	try {
		//se busca en la base de datos si ya existe un usuario con el mismo nombre de usuario o email
		const viejosnombreDeUsuario = await usuarios.findOne({where:{nombreDeUsuario: `${req.body.nombreDeUsuario}`}, raw: true}) 
		const viejosEmails = await usuarios.findOne({where:{email: `${req.body.email}`}, raw: true}) 


		//si alguno de los dos no es null, significa que ya existe un usuario con ese nombre de usuario o email
		//y se envía un mensaje de error correspondiente
		if(viejosnombreDeUsuario !== null || viejosEmails !== null){ 
			if(viejosEmails === null && viejosnombreDeUsuario !== null){
				throw res.statusCode(409).send("nombre de usuario en uso")
			}else{
				throw res.statusCode(409).send("email en uso")
			}


		//si ambos son null, significa que no hay conflictos y se puede continuar con el registro
		}else{
			//convertimos la edad a número para que pase la validación del esquema debido a que los datos del formulario llegan como strings
			const edadANumero = Number(req.body.edad)
			req.body.edad = edadANumero


			//validamos los datos del formulario con el esquema de zod
			const resultado = await registrarUsuarioSchema.parse(req.body)


			//si la validación es correcta, se encripta la contraseña y se compara con la confirmación de contraseña
			if(resultado !== typeof(Error)){
				const encriptarContraseña = await bcrypt.hash(`${req.body.contraseña}`, 10)
				const resultado = await bcrypt.compare(`${req.body.confirmarContraseña}`, `${encriptarContraseña}`)


				//si las contraseñas coinciden, se crea el usuario en la base de datos y se renderiza la vista de mi perfil con los datos del usuario
				if(resultado){


					//reescribimos la contraseña en el body con la contraseña encriptada para guardarla en la base de datos
					req.body.contraseña = encriptarContraseña


					//creamos el usuario en la base de datos
					await usuarios.create(req.body)


					//buscamos los datos del usuario recién creado para renderizarlos en la vista de mi perfil, como la base de datos nos devuelve un objeto, hay que acceder a la propiedad correspondiente
					//para cada dato que queremos mostrar en la vista
					const nombreDeUsuarioO = await usuarios.findOne({where:{nombreDeUsuario: `${req.body.nombreDeUsuario}`}, raw: true, attributes:['nombreDeUsuario']})
					const nombreDeUsuario = nombreDeUsuarioO.nombreDeUsuario
					const emailO = await usuarios.findOne({where:{nombreDeUsuario: `${req.body.nombreDeUsuario}`}, raw: true, attributes:['email']})
					console.log(emailO)
					const email = emailO.email
					const edadO = await usuarios.findOne({where:{nombreDeUsuario: `${req.body.nombreDeUsuario}`}, raw: true, attributes:['edad']})
					const edad = edadO.edad
					const generoO = await usuarios.findOne({where:{nombreDeUsuario: `${req.body.nombreDeUsuario}`}, raw: true, attributes:['genero']})
					const genero = generoO.genero


					//renderizamos la vista de mi perfil con los datos del usuario
					res.statusCode(200).render(`miPerfil`, {email, edad, nombreDeUsuario, genero})
				}
				}else{
					//si las contraseñas no coinciden, se envía un mensaje de error
					res.statusCode(400).send("no coinciden las contraseñas")
				}
			}


	//si hay algún error en la validación, se envía un mensaje de error
	}catch (error) {
		//si el error es de zod, se envía el mensaje de error correspondiente
		if(error instanceof z.ZodError){
			//accedemos al primer error del array de errores y enviamos su mensaje, que es el mesanje que configuramos en el esquema de zod
			throw res.statusCode(400).send(error.issues[0].message)
		}else{

			//si no es de zod el error, se muestra el error en la consola
			console.log(error)
			res.statusCode(500).send("error en el servidor")
		}
	}
})


//esta es la ruta post que se encarga de iniciar sesión
router.post('/iniciarSesion', async (req, res)=>{
	//buscamos el usuario en la base de datos por su nombre de usuario y obtenemos su nombre de usuario, contraseña y id
	const usuario = await usuarios.findOne({where:{nombreDeUsuario: `${req.body.nombreDeUsuario}`}, raw: true, attributes: ['nombreDeUsuario', 'contraseña', 'id']}) 


	//si el usuario no existe, se envía un mensaje de error
	if(usuario === null){
		throw res.statusCode(400).send("nombre de usuario no existe")
	}


	//si el usuario existe, se compara la contraseña ingresada con la contraseña encriptada en la base de datos
	//usamos bcrypt para comparar las contraseñas
	const coincidencia = await bcrypt.compare(`${req.body.contraseña}`, `${usuario.contraseña}`) 


	//si las contraseñas no coinciden, se envía un mensaje de error
	if(!coincidencia){
		res.statusCode(400).send("contraseña incorrecta")
	}


	//si coinciden, se renderiza la vista de mi perfil con los datos del usuario
	else{
		//buscamos los datos del usuario para renderizarlos en la vista de mi perfil
		//como la base de datos nos devuelve un objeto, hay que acceder a la propiedad correspondiente para cada dato que queremos mostrar en la vista
		const nombreDeUsuarioO = await usuarios.findOne({where:{nombreDeUsuario: `${req.body.nombreDeUsuario}`}, raw: true, attributes:['nombreDeUsuario']})
		const nombreDeUsuario = nombreDeUsuarioO.nombreDeUsuario
		const emailO = await usuarios.findOne({where:{nombreDeUsuario: `${req.body.nombreDeUsuario}`}, raw: true, attributes:['email']})
		const email = emailO.email
		const edadO = await usuarios.findOne({where:{nombreDeUsuario: `${req.body.nombreDeUsuario}`}, raw: true, attributes:['edad']})
		const edad = edadO.edad
		const generoO = await usuarios.findOne({where:{nombreDeUsuario: `${req.body.nombreDeUsuario}`}, raw: true, attributes:['genero']})
		const genero = generoO.genero


		//renderizamos la vista de mi perfil con los datos del usuario
		res.statusCode(200).render(`miPerfil`, {email, edad, nombreDeUsuario, genero})
	}
})


//esta es la ruta put que se encarga de cambiar el nombre de usuario
router.put('/cambiarNombreDeUsuario', async (req, res)=>{
	try {
		//validamos que el nuevo nombre de usuario cumpla con las reglas del esquema(mínimo 3 caracteres, máximo 20, sin espacios)
		await cambiarNombreDeUsuarioSchema.parse(req.body)

	
	//si hay un error en la validación, se envía un mensaje de error
	} catch (error) {
		//si el error es de zod, se envía el mensaje de error correspondiente
		if(error instanceof z.ZodError){
			throw res.statusCode(400).send(error.issues[0].message)
		}else{
			//si no, se muestra el error en la consola
			console.log(error)
			throw res.statusCode(500).send("error en el servidor")
		}
	}


	//buscamos el usuario en la base de datos por su nombre de usuario y obtenemos su nombre de usuario, contraseña y id
	const viejoNombreDeUsuarioYContraseña = await usuarios.findOne({where: {nombreDeUsuario:`${req.body.nombreDeUsuario}`}, attributes:['nombreDeUsuario', 'contraseña','id'], raw: true})


	//si el usuario no existe, se envía un mensaje de error
	if(viejoNombreDeUsuarioYContraseña === null){
		throw res.send("nombre de usuario inexistente")
	}


	//si el usuario existe, se compara la contraseña ingresada con la contraseña encriptada en la base de datos
	//usamos bcrypt para comparar las contraseñas
	const compararContraseñas = await bcrypt.compare(`${req.body.contraseña}`, `${viejoNombreDeUsuarioYContraseña.contraseña}`)


	//si las contraseñas no coinciden, se envía un mensaje de error
	if(!compararContraseñas){
		throw res.statusCode(400).send("contraseña incorrecta")
	}


	//si las contraseñas coinciden, se actualiza el nombre de usuario en la base de datos
	else{
		//usamos el método update de sequelize para actualizar el nombre de usuario
		await usuarios.update(
			{nombreDeUsuario:`${req.body.nuevoNombreDeUsuario}`},
			{where: {nombreDeUsuario: `${req.body.nombreDeUsuario}`}}
		)


		//buscamos el nuevo nombre de usuario en la base de datos para renderizarlo en la vista
		//como la base de datos nos devuelve un objeto, hay que acceder a la propiedad
		const nuevoNombreDeUsuarioO = await usuarios.findOne({where: {nombreDeUsuario:`${req.body.nuevoNombreDeUsuario}`}, attributes:['nombreDeUsuario'], raw: true})
		const nuevoNombreDeUsuario = await nuevoNombreDeUsuarioO.nombreDeUsuario


		//renderizamos la vista de nuevo nombre de usuario con el nuevo nombre de usuario
		//esta vista es una página de confirmación que muestra el nuevo nombre de usuario
		res.statusCode(200).render("nuevoNombreDeUsuario", {nuevoNombreDeUsuario} )
	}
})



//esta es la ruta delete que se encarga de borrar un usuario
router.delete('/borrarUsuario',async (req,res)=>{
	//buscamos el usuario en la base de datos por su nombre de usuario y obtenemos su nombre de usuario, contraseña y id
	const usuario = await usuarios.findOne({where:{nombreDeUsuario: `${req.body.nombreDeUsuario}`}, raw: true, attributes: ['nombreDeUsuario', 'contraseña', 'id']}) 


	//si el usuario no existe, se envía un mensaje de error
	if(usuario === null){
		throw res.statusCode(400).send("el usuario no existe")
	}


	//si el usuario existe, se compara la contraseña ingresada con la contraseña encriptada en la base de datos
	//usamos bcrypt para comparar las contraseñas
	const coincidencia = await bcrypt.compare(`${req.body.contraseña}`, `${usuario.contraseña}`) 


	//si las contraseñas no coinciden, se envía un mensaje de error
	if(!coincidencia){
		res.statusCode(400).send("contraseña incorrecta")
	}


	//si las contraseñas coinciden, se borra el usuario de la base de datos
	else{
		//usamos el método destroy de sequelize para borrar el usuario
		await usuarios.destroy({where:{id:`${usuario.id}`}})
		res.statusCode(200).send("usuario borrado")
	}
})


//exportamos el router para que pueda ser utilizado en otros archivos
//esto es necesario para que las rutas puedan ser utilizadas en el archivo principal de la aplicación
export default router

