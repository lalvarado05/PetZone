const express = require('express');
const Carrito = require('../models/carrito');
const Producto = require('../models/producto');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        let carrito = await Carrito.findOne({ usuario: req.usuario._id }).populate('items.producto');
        if (!carrito) {
            carrito = { usuario: req.usuario._id, items: [] };
        }
        res.json({ message: 'Carrito obtenido.', estado: 'success', carrito });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener carrito.', estado: 'error', error: error.message });
    }
});

router.post('/agregar', auth, async (req, res) => {
    const { productoId, cantidad = 1 } = req.body;

    if (!productoId) {
        return res.status(400).json({ message: 'El campo productoId es requerido.', estado: 'error' });
    }

    try {
        const producto = await Producto.findById(productoId);
        if (!producto || !producto.activo) {
            return res.status(404).json({ message: 'Producto no encontrado.', estado: 'error' });
        }

        let carrito = await Carrito.findOne({ usuario: req.usuario._id });

        if (!carrito) {
            carrito = new Carrito({ usuario: req.usuario._id, items: [] });
        }

        const itemExistente = carrito.items.find(item => item.producto.toString() === productoId);

        if (itemExistente) {
            itemExistente.cantidad += cantidad;
        } else {
            carrito.items.push({ producto: productoId, cantidad });
        }

        await carrito.save();
        await carrito.populate('items.producto');

        res.json({ message: 'Producto agregado al carrito.', estado: 'success', carrito });
    } catch (error) {
        res.status(500).json({ message: 'Error al agregar al carrito.', estado: 'error', error: error.message });
    }
});

router.put('/actualizar', auth, async (req, res) => {
    const { productoId, cantidad } = req.body;

    if (!productoId || cantidad === undefined) {
        return res.status(400).json({ message: 'Los campos productoId y cantidad son requeridos.', estado: 'error' });
    }

    try {
        const carrito = await Carrito.findOne({ usuario: req.usuario._id });
        if (!carrito) {
            return res.status(404).json({ message: 'Carrito no encontrado.', estado: 'error' });
        }

        if (cantidad <= 0) {
            carrito.items = carrito.items.filter(item => item.producto.toString() !== productoId);
        } else {
            const item = carrito.items.find(item => item.producto.toString() === productoId);
            if (!item) {
                return res.status(404).json({ message: 'Producto no encontrado en el carrito.', estado: 'error' });
            }
            item.cantidad = cantidad;
        }

        await carrito.save();
        await carrito.populate('items.producto');

        res.json({ message: 'Carrito actualizado.', estado: 'success', carrito });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar carrito.', estado: 'error', error: error.message });
    }
});

router.delete('/eliminar/:productoId', auth, async (req, res) => {
    try {
        const carrito = await Carrito.findOne({ usuario: req.usuario._id });
        if (!carrito) {
            return res.status(404).json({ message: 'Carrito no encontrado.', estado: 'error' });
        }

        carrito.items = carrito.items.filter(item => item.producto.toString() !== req.params.productoId);
        await carrito.save();
        await carrito.populate('items.producto');

        res.json({ message: 'Producto eliminado del carrito.', estado: 'success', carrito });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar del carrito.', estado: 'error', error: error.message });
    }
});

router.delete('/vaciar', auth, async (req, res) => {
    try {
        const carrito = await Carrito.findOne({ usuario: req.usuario._id });
        if (carrito) {
            carrito.items = [];
            await carrito.save();
        }
        res.json({ message: 'Carrito vaciado.', estado: 'success' });
    } catch (error) {
        res.status(500).json({ message: 'Error al vaciar carrito.', estado: 'error', error: error.message });
    }
});

module.exports = router;
