let sqlite = require('sqlite3').verbose();
let Promise = require('bluebird')

let db = new sqlite.Database('data.db');

// Функция просто для тестирования
function get() {
    let sql = "SELECT * FROM Teacher";

    db.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            console.log(row);
        });
    });
}

// Проверка наличия учителя с подобным логином (true - если нет, false - если есть)
function checkTeacher(login) {
    let sql = "SELECT Login From Teacher Where Login = (?)";

    return new Promise((resolve, reject) => {
        db.all(sql, [login], (err, row) => {
            let res = false;

            if (err) {
                reject(err);
            }

            if (row.length === 0) {
                res = true;
            }

            resolve(res);
        })
    })

}

// Добавление учителя в базу данных (true - если удалось добавить, false - если нет)
function addTeacher(login, password) {
    return new Promise((resolve, reject) => {
        let res = false;

        db.run('INSERT INTO Teacher(Login, Password) VALUES (?, ?)', [login, password], function (err) {
            if (err) {
                console.log(err.message);
                resolve(res)
            }
            res = true;
            resolve(res);
        });
    });
}

// Добавление класса учителем
function addClass(classNumber, teacherID) {

    return new Promise((resolve, reject) => {

        let res = false;

        db.run('INSERT INTO Class(Number, TeacherID) VALUES (?, ?)', [classNumber, teacherID], (err) => {
            if (err) {
                console.log(err.message);
                resolve(res);
            }

            res = true;
            resolve(res)
        });
    });
}

// login (0 - если ошибка или не совпадает логин или пароль, 1 - если успешно, 2 - если такой пользователь уже есть)
function login(Login, Password) {
    return new Promise((resolve, reject) => {
        db.all('SELECT Login, Password FROM Teacher WHERE Login = (?) and Password = (?)', [Login, Password], (err, row) => {
            let res = 0;
            if (err) {
                console.log(err.message)
                resolve(res);
            }

            if (row.length === 0) {
                res = 1
            } else {
                res = 2
            }

            resolve(res)
        });
    })
}

// register (true - если успешно, false - если неуспешно)
async function register(login, password) {
    let regRes = false;

    checkTeacher(login).then(res => {
        regRes = res;
    });

    if (regRes === false) {
        regRes = await addTeacher(login, password);
    }

    return regRes;
}

// Для того, чтобы можно было сделать require
module.exports = {
    db,
    get,
    checkTeacher,
    addTeacher,
    addClass,
    login,
    register
}
