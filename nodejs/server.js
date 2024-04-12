import dotenv from 'dotenv';
import express from 'express';
import mysql from 'mysql2/promise';


dotenv.config({ path: './.env' });

const { DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD, DATABASE, DATABASE_PORT } = process.env;

const mysqlClient = async () => {
    return await mysql.createConnection({
        host: DATABASE_HOST,
        user: DATABASE_USER,
        password: DATABASE_PASSWORD,
        database: DATABASE,
        port: DATABASE_PORT
    }).then(async (connection) => {
        await connection.execute(
            'CREATE TABLE IF NOT EXISTS people (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255), email VARCHAR(255))'
        );

        return connection;
    }).catch((err) => {
        console.error('An error occurred', err);
    });
};

async function insertNewPeople(connection) {
    const insertNewPersonQuery = "INSERT INTO people (name, email) VALUES (?, ?), (?, ?)";
    const values = ['Alexandre', 'amartins.dev@gmail.com', 'John', 'john@mail.com'];
    return await connection.query(insertNewPersonQuery, values);
}

async function selectAllPeople() {
    const connection = await mysqlClient();
    const selectAllPeopleQuery = "SELECT * FROM people";
    return await connection.query(selectAllPeopleQuery)
        .then(async ([result, fields]) => {
            return Promise.resolve(result);
        })
        .then(async (result) => {
            if (!result.length) {
                return await insertNewPeople(connection)
                    .then(async () => {
                        const [result, fields] = await connection.query(selectAllPeopleQuery);
                        return Promise.resolve(result);
                    }
                    ).catch((err) => {
                        console.error('An error occurred', err);
                        return Promise.reject(err);
                    })
            }

            return Promise.resolve(result);
        })
        .catch((err) => {
            console.error('An error occurred', err);
        });
}

const app = express();

app.set('view engine', 'hbs');

app.use(express.urlencoded({ extended: 'false' }))
app.use(express.json())

app.get('/', async (req, res) => {
    await selectAllPeople()
        .then((people) => {
            res.render('index', { people });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('An error occurred');
        });
});

app.get('/helthcheck', (_, res) => {
    res.send('Ok');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

