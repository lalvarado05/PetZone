const express = require('express');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.post('/registro', async (req, res) => {
    const { nombre, username, email, password, cedula } = req.body;

    if (!nombre || !username || !email || !password) {
        return res.status(400).json({
            message: 'Los campos nombre, username, email y password son requeridos.',
            estado: 'error'
        });
    }

    try {
        const existeEmail = await Usuario.findOne({ email });
        if (existeEmail) {
            return res.status(400).json({ message: 'El email ya está registrado.', estado: 'error' });
        }

        const existeUsername = await Usuario.findOne({ username });
        if (existeUsername) {
            return res.status(400).json({ message: 'El username ya está registrado.', estado: 'error' });
        }

        const usuario = new Usuario({ nombre, username, email, password, cedula });
        await usuario.save();

        const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Usuario registrado exitosamente.',
            estado: 'success',
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                username: usuario.username,
                email: usuario.email,
                rol: usuario.rol
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar usuario.', estado: 'error', error: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({
            message: 'Los campos login y password son requeridos.',
            estado: 'error'
        });
    }

    try {
        const usuario = await Usuario.findOne({
            $or: [{ email: login.toLowerCase() }, { username: login }]
        });

        if (!usuario) {
            return res.status(401).json({ message: 'Credenciales inválidas.', estado: 'error' });
        }

        const passwordValido = await usuario.compararPassword(password);
        if (!passwordValido) {
            return res.status(401).json({ message: 'Credenciales inválidas.', estado: 'error' });
        }

        const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Inicio de sesión exitoso.',
            estado: 'success',
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                username: usuario.username,
                email: usuario.email,
                rol: usuario.rol
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al iniciar sesión.', estado: 'error', error: error.message });
    }
});

router.get('/perfil', auth, async (req, res) => {
    res.json({
        message: 'Perfil del usuario.',
        estado: 'success',
        usuario: req.usuario
    });
});

module.exports = router;
