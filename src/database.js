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

// Добавление урока true-если успешно, false-если нет
function addLesson(groupID, teacherID, date) {
    return new Promise((resolve, reject) => {

        let sql = 'INSERT INTO Lesson(groupID, teacherID, date) VALUES (?, ?, ?)';
        let res = false;

        db.run(sql, [groupID, teacherID, date], (err) => {
            if (err) {
                console.log(err.message);
                resolve(res)
            }

            res = true;
            resolve(res);
        });
    });
}

// вернет пустой массив если нихуя нет или ошибка, или вернет массив данных студентов

function getStudentsByGroup(number) {
    return new Promise((resolve, reject) => {
        let sql = "SELECT Student.Name, Student.Surname, Student.Zoom FROM Student JOIN Class ON Student.GroupID = Class.ID WHERE Class.Number = (?)"

        let res = [];
        db.all(sql, [number], (err, rows) => {
            if (err) {
                console.log(err.message)
                resolve(res)
            }

            rows.forEach(row => {
                res.push(row);
            });

            resolve(res)
        })
    });

}

function getGroupsByTeacher(teacherID) {
    return new Promise((resolve, reject) => {

        let sql = 'SELECT Number FROM Class WHERE Class.TeacherID = (?)';
        let res = [];

        db.all(sql, [teacherID], (err, rows) => {
           if (err) {
               console.log(err.message);
               resolve(res);
           }

            rows.forEach(row => {
               res.push(row);
            });

           resolve(res);
        });
    });
}

function getGroupIDbyNumber(number) {
    return new Promise((resolve, reject) => {
        let sql = "SELECT ID FROM Class WHERE Number = (?)";

        db.get(sql, [number], (err, row) => {
            if (err) {
                console.log(err.message);
                resolve(0)
            }

            resolve(row.ID);
        });


    });
}

function addStudent(name, surname, zoom, groupNumber) {
    return new Promise((resolve, reject) => {
        let check = false;
        let gRes = 0;

        getGroupIDbyNumber(groupNumber).then(res => {
            if (res > 0) {
                check = true;
                gRes = res;
            }
            if (check === true) {
                let sql = "INSERT INTO Student (Name, Surname, Zoom, GroupID) VALUES (?, ?, ?, ?)";
                let res = false;

                db.run(sql, [name, surname, zoom, gRes], (err) => {
                    if (err) {
                        console.log(err.message);
                        resolve(res);
                    }

                    res = true;
                    resolve(res);
                });
            }
        });
    });
}

function getGroupByTeacher(login) {
    return new Promise ((resolve, reject) => {
        let sql = "SELECT Number FROM Class WHERE TeacherID = (?)";
        let res = [];

        db.all(sql, [login], (err, rows) => {

            if (err) {
                console.log(err.message);
                resolve(res)
            }

            rows.forEach(row => {
               res.push(row);
            });

            resolve(res);
        });
    });
}

addStudent('Andr', 'Alex', 'asdf','M3205').then(res => {
    console.log(res);
});

// Для того, чтобы можно было сделать require
module.exports = {
    db,
    login,
    register,
    addClass,
    addLesson,
    getStudentsByGroup,
    getGroupsByTeacher
};

