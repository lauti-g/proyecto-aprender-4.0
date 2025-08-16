//importamos zod para crear esquemas de validación
import z from "zod";



// Creamos un esquema de validación para el registro de usuarios
// Este esquema define las reglas que deben cumplir los datos de entrada
const registrarUsuarioSchema = z.object({


    //nombre de usuario tiene que ser un string, no puede estar vacío, debe tener entre 3 y 20 caracteres y no puede contener espacios
    nombreDeUsuario: z.string("el nombre debe ser un texto").min(3, "muy corto el nombre (min: 3 caracteres)").max(20, "muy largo el nombre(max: 20 caracteres)").refine(
        (val) => !val.includes(" "),
        "El usuario no puede contener espacios"
    ),


    //email tiene que ser un string, no puede estar vacío, debe ser un email válido y debe tener entre 4 y 100 caracteres
    email: z.email("el mail tiene que ser un formato mail").min(4).max(100),


    //edad tiene que ser un número, no puede estar vacío, debe ser mayor o igual a 18 y menor o igual a 122
    edad: z.number("la edad tiene que ser un numero").min(18, "solo mayores de 18").max(122, "no creo que seas tan viejo/a"),


    //contraseña tiene que ser un string, no puede estar vacío y debe tener entre 5 y 100 caracteres
    contraseña: z.string().min(5, "contraseña muy corta(min: 5 characters)").max(100, "contraseña muy larga(max: 100 caracteres)")
    })




// Creamos un esquema de validación para cambiar el nombre de usuario
// Este esquema define las reglas que deben cumplir los datos de entrada
const cambiarNombreDeUsuarioSchema = z.object({
    //nuevo nombre de usuario tiene que ser un string, no puede estar vacío, debe tener entre 3 y 20 caracteres y no puede contener espacios
    nuevoNombreDeUsuario: z.string("el nuevo nombre debe ser un texto").min(3, "muy corto el nuevo nombre (min: 3 characters)").max(20, "muy largo el nuevo nombre(max: 20 characters)").refine(
        (val) => !val.includes(" "),
        "El nuevo usuario no puede contener espacios"
    )
})



// Exportamos los esquemas para que puedan ser utilizados en otros archivos
export {registrarUsuarioSchema, cambiarNombreDeUsuarioSchema}
