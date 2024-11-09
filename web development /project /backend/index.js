const express = require('express');
const { createtodo, updatetodo } = require('./types');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const { todos } = require('./db'); // Ensure todos is a Mongoose model

app.use(express.json());

app.get('/todos', async (req, res) => {
    try {
        const todoList = await todos.find();
        res.json(todoList);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving todos', error });
    }
});

// Update a todo
app.put('/update', async (req, res) => {
    const updatePayload = req.body;
    const parsedPayload = updatetodo.safeParse(updatePayload);

    if (!parsedPayload.success) {
        return res.status(400).json({ message: 'Invalid data' });
    }

    try {
        const updatedTodo = await todos.findByIdAndUpdate(
            parsedPayload.data.id,
            { completed: true },
            { new: true }
        );

        if (!updatedTodo) {
            return res.status(404).json({ message: 'Todo not found' });
        }

        res.json({ message: 'Todo updated successfully', updatedTodo });
    } catch (error) {
        res.status(500).json({ message: 'Error updating todo', error });
    }
});

// Create a new todo
app.post('/post', async (req, res) => {
    const createPayload = req.body;
    const parsedPayload = createtodo.safeParse(createPayload);

    if (!parsedPayload.success) {
        return res.status(400).json({ message: 'Invalid data' });
    }

    try {
        const newTodo = await todos.create({
            title: parsedPayload.data.title,
            description: parsedPayload.data.description,
        });

        res.json({ message: 'Todo created successfully', newTodo });
    } catch (error) {
        res.status(500).json({ message: 'Error creating todo', error });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
