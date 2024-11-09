const express = require('express');
const app = express();

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle login
app.post('/login', (req, res) => { 
    const { username, password } = req.body;
    
    // For simplicity, logging the data. In production, avoid logging sensitive data.
    console.log(`Username: ${username}, Password: ${password}`);
    
    if (username === 'admin' && password === 'admin') {
        res.send('Login successful');
    } else {
        res.status(401).send('Login failed');
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
