const Usuario = require('../models/usuario');
const { auth, esAdmin } = require('../middleware/auth');
const express = require('express');
const router = express.Router();

router.get('/', auth, esAdmin, async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-password');
        res.json({
            message: 'Usuarios listados',
            total: usuarios.length,
            estado: 'success',
            usuarios
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al listar los usuarios',
            estado: 'error',
            error: error.message
        });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select('-password');
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado', estado: 'error' });
        }
        res.json({ message: 'Usuario encontrado', estado: 'success', usuario });
    } catch (error) {
        res.status(500).json({ message: 'Error al buscar el usuario', estado: 'error' });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        if (req.usuario._id.toString() !== req.params.id && req.usuario.rol !== 'admin') {
            return res.status(403).json({ message: 'No tiene permiso para editar este usuario.', estado: 'error' });
        }

        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado', estado: 'error' });
        }

        const { nombre, email, cedula, rol } = req.body;

        if (rol !== undefined) {
            if (req.usuario.rol !== 'admin') {
                return res.status(403).json({ message: 'Solo un administrador puede cambiar el rol.', estado: 'error' });
            }
            if (rol !== 'cliente' && rol !== 'admin') {
                return res.status(400).json({ message: 'Rol inválido. Valores permitidos: cliente, admin.', estado: 'error' });
            }
            usuario.rol = rol;
        }

        if (nombre !== undefined) usuario.nombre = nombre;
        if (email !== undefined) usuario.email = email;
        if (cedula !== undefined) usuario.cedula = cedula;

        await usuario.save();
        const usuarioActualizado = await Usuario.findById(usuario._id).select('-password');

        res.json({ message: 'Usuario actualizado', estado: 'success', usuario: usuarioActualizado });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el usuario', estado: 'error' });
    }
});

router.delete('/:id', auth, esAdmin, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado', estado: 'error' });
        }
        await usuario.deleteOne();
        res.json({ message: 'Usuario eliminado', estado: 'success' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el usuario', estado: 'error' });
    }
});

module.exports = router;
