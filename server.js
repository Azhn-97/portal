const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt'); // құпиясөзді қауіпсіз сақтау үшін

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL қосылым
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // өз пароліңіз
    database: 'portal'
});

db.connect(err => {
    if(err) console.error('MySQL қате:', err);
    else console.log('MySQL қосылды!');
});

// Тіркелу
app.post('/register', async (req, res) => {
    const { fullname, email, password, phone, role, specialty, group } = req.body;
    if(!fullname || !email || !password || !role) return res.status(400).send('Барлық міндетті өрістерді толтырыңыз');

    const [rows] = await db.promise().query('SELECT * FROM users WHERE email=?', [email]);
    if(rows.length) return res.status(400).send('Бұл email тіркелген');

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.promise().query(
        'INSERT INTO users (fullname,email,password,phone,role,specialty,`group`) VALUES (?,?,?,?,?,?,?)',
        [fullname,email,hashedPassword,phone,role,specialty,group]
    );
    res.send('Тіркелу сәтті!');
});

// Кіру
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const [rows] = await db.promise().query('SELECT * FROM users WHERE email=?', [email]);
    if(rows.length === 0) return res.status(400).send('Email немесе құпиясөз дұрыс емес');

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.status(400).send('Email немесе құпиясөз дұрыс емес');

    res.send({
        message: 'Кіру сәтті!',
        user: {
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            role: user.role,
            specialty: user.specialty,
            group: user.group
        }
    });
});

app.listen(3000, () => console.log('Server 3000 портында іске қосылды'));
