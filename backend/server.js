const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');
const MySQLStore = require('express-mysql-session')(session);

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'srms',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const sessionStore = new MySQLStore({
    expiration: 86400000,
    createDatabaseTable: true,
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
}, pool);

app.use(session({
    secret: 'srms-secret-key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

async function initDB() {
    const conn = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password
    });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await conn.end();

    await pool.query(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS customer (
        customerNumber INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        telephone VARCHAR(50),
        address TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS product (
        productCode VARCHAR(50) PRIMARY KEY,
        productName VARCHAR(255) NOT NULL,
        quantitySold INT DEFAULT 0,
        unitPrice DECIMAL(10,2) NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS sale (
        invoiceNumber INT AUTO_INCREMENT PRIMARY KEY,
        salesDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        paymentMethod VARCHAR(100),
        totalAmountPaid DECIMAL(10,2) NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('Database tables initialized');
}

initDB().catch(err => console.error('DB init error:', err));

const isAuthenticated = (req, res, next) => {
    if (req.session.userId) return next();
    res.status(401).send({ error: 'Unauthorized' });
};

app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).send({ message: 'User created' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).send({ error: 'Username already exists' });
        } else {
            res.status(400).send({ error: error.message });
        }
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length > 0) {
            const user = rows[0];
            if (await bcrypt.compare(password, user.password)) {
                req.session.userId = user.id;
                req.session.username = user.username;
                res.send({ message: 'Logged in', username: user.username });
            } else {
                res.status(401).send({ error: 'Invalid credentials' });
            }
        } else {
            res.status(401).send({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.send({ message: 'Logged out' });
});

app.get('/api/me', async (req, res) => {
    if (req.session.userId) {
        const [rows] = await pool.query('SELECT username FROM users WHERE id = ?', [req.session.userId]);
        if (rows.length > 0) {
            res.send({ username: rows[0].username });
        } else {
            res.status(401).send({ error: 'Not logged in' });
        }
    } else {
        res.status(401).send({ error: 'Not logged in' });
    }
});

app.get('/api/customers', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM customer ORDER BY customerNumber DESC');
        res.send(rows);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.post('/api/customers', isAuthenticated, async (req, res) => {
    try {
        const { firstName, lastName, telephone, address } = req.body;
        const [result] = await pool.query(
            'INSERT INTO customer (firstName, lastName, telephone, address) VALUES (?, ?, ?, ?)',
            [firstName, lastName, telephone || null, address || null]
        );
        const [rows] = await pool.query('SELECT * FROM customer WHERE customerNumber = ?', [result.insertId]);
        res.send(rows[0]);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.get('/api/products', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM product ORDER BY productCode DESC');
        res.send(rows);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.post('/api/products', isAuthenticated, async (req, res) => {
    try {
        const { productCode, productName, quantitySold, unitPrice } = req.body;
        await pool.query(
            'INSERT INTO product (productCode, productName, quantitySold, unitPrice) VALUES (?, ?, ?, ?)',
            [productCode, productName, quantitySold || 0, unitPrice]
        );
        const [rows] = await pool.query('SELECT * FROM product WHERE productCode = ?', [productCode]);
        res.send(rows[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).send({ error: 'Product code already exists' });
        } else {
            res.status(400).send({ error: error.message });
        }
    }
});

app.get('/api/sales', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM sale ORDER BY salesDate DESC');
        res.send(rows);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.post('/api/sales', isAuthenticated, async (req, res) => {
    try {
        const { salesDate, paymentMethod, totalAmountPaid } = req.body;
        const dateVal = salesDate ? new Date(salesDate).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
        const [result] = await pool.query(
            'INSERT INTO sale (salesDate, paymentMethod, totalAmountPaid) VALUES (?, ?, ?)',
            [dateVal, paymentMethod || null, totalAmountPaid]
        );
        const [rows] = await pool.query('SELECT * FROM sale WHERE invoiceNumber = ?', [result.insertId]);
        res.status(201).send(rows[0]);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.put('/api/sales/:id', isAuthenticated, async (req, res) => {
    try {
        const { salesDate, paymentMethod, totalAmountPaid } = req.body;
        const dateVal = salesDate ? new Date(salesDate).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
        await pool.query(
            'UPDATE sale SET salesDate=?, paymentMethod=?, totalAmountPaid=? WHERE invoiceNumber=?',
            [dateVal, paymentMethod, totalAmountPaid, req.params.id]
        );
        const [rows] = await pool.query('SELECT * FROM sale WHERE invoiceNumber = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).send({ error: 'Sale not found' });
        res.send(rows[0]);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.delete('/api/sales/:id', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM sale WHERE invoiceNumber = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).send({ error: 'Sale not found' });
        await pool.query('DELETE FROM sale WHERE invoiceNumber = ?', [req.params.id]);
        res.send({ message: 'Sale deleted' });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.get('/api/report/customers', isAuthenticated, async (req, res) => {
    try {
        const { period } = req.query;
        let dateFilter = '';
        if (period === 'daily') dateFilter = 'AND DATE(createdAt) = CURDATE()';
        else if (period === 'weekly') dateFilter = 'AND YEARWEEK(createdAt) = YEARWEEK(CURDATE())';
        else if (period === 'monthly') dateFilter = 'AND MONTH(createdAt) = MONTH(CURDATE()) AND YEAR(createdAt) = YEAR(CURDATE())';
        const [rows] = await pool.query(`SELECT * FROM customer WHERE 1=1 ${dateFilter} ORDER BY createdAt DESC`);
        res.send(rows);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.get('/api/report/products', isAuthenticated, async (req, res) => {
    try {
        const { period } = req.query;
        let dateFilter = '';
        if (period === 'daily') dateFilter = 'AND DATE(createdAt) = CURDATE()';
        else if (period === 'weekly') dateFilter = 'AND YEARWEEK(createdAt) = YEARWEEK(CURDATE())';
        else if (period === 'monthly') dateFilter = 'AND MONTH(createdAt) = MONTH(CURDATE()) AND YEAR(createdAt) = YEAR(CURDATE())';
        const [rows] = await pool.query(`SELECT * FROM product WHERE 1=1 ${dateFilter} ORDER BY createdAt DESC`);
        res.send(rows);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.get('/api/report/sales', isAuthenticated, async (req, res) => {
    try {
        const { period } = req.query;
        let dateFilter = '';
        if (period === 'daily') dateFilter = 'AND DATE(salesDate) = CURDATE()';
        else if (period === 'weekly') dateFilter = 'AND YEARWEEK(salesDate) = YEARWEEK(CURDATE())';
        else if (period === 'monthly') dateFilter = 'AND MONTH(salesDate) = MONTH(CURDATE()) AND YEAR(salesDate) = YEAR(CURDATE())';
        const [rows] = await pool.query(`SELECT * FROM sale WHERE 1=1 ${dateFilter} ORDER BY salesDate DESC`);
        res.send(rows);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
