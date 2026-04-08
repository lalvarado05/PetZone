const express = require('express');
const Categoria = require('../models/categoria');
const { auth, esAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const categorias = await Categoria.find().sort({ nombre: 1 });
        res.json({
            message: 'Categorías listadas.',
            total: categorias.length,
            estado: 'success',
            categorias
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al listar categorías.', estado: 'error', error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const categoria = await Categoria.findById(req.params.id);
        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada.', estado: 'error' });
        }
        res.json({ message: 'Categoría encontrada.', estado: 'success', categoria });
    } catch (error) {
        res.status(500).json({ message: 'Error al buscar categoría.', estado: 'error', error: error.message });
    }
});

router.post('/', auth, esAdmin, async (req, res) => {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
        return res.status(400).json({ message: 'El campo nombre es requerido.', estado: 'error' });
    }

    try {
        const categoria = new Categoria({ nombre, descripcion });
        await categoria.save();
        res.status(201).json({ message: 'Categoría creada.', estado: 'success', categoria });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Ya existe una categoría con ese nombre.', estado: 'error' });
        }
        res.status(500).json({ message: 'Error al crear categoría.', estado: 'error', error: error.message });
    }
});

router.put('/:id', auth, esAdmin, async (req, res) => {
    try {
        const categoria = await Categoria.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada.', estado: 'error' });
        }
        res.json({ message: 'Categoría actualizada.', estado: 'success', categoria });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar categoría.', estado: 'error', error: error.message });
    }
});

router.delete('/:id', auth, esAdmin, async (req, res) => {
    try {
        const categoria = await Categoria.findByIdAndDelete(req.params.id);
        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada.', estado: 'error' });
        }
        res.json({ message: 'Categoría eliminada.', estado: 'success' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar categoría.', estado: 'error', error: error.message });
    }
});

module.exports = router;
