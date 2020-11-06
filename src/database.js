let sqlite = require('sqlite3').verbose();
let Promise = require('bluebird');

let db = new sqlite.Database('data.db');

// register (true - если успешно, false - если неуспешно)
async function teacherRegister(login, password) {
    let regRes = false;

    await checkTeacher(login).then(res => {
        regRes = res;
    });

    if (regRes === true) {
        regRes = await addTeacher(login, password);
    }
    return regRes;
}

async function studentRegister(login, password, name, surname, groupName) {
    let regRes = false;
    let group  = -1;

    await checkStudent(login).then(res => {
        regRes = res;
    });

    await getGroupIDbyNumber(groupName).then(res => {
        group = res;
    });
    if (regRes === false) {
        regRes = await addStudent(login, password, name, surname, group);
    }

    return regRes;
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

function checkStudent(login) {

    let sql = "SELECT Login From Student Where Login = (?)";

    return new Promise((resolve, reject) => {
        db.all(sql, [login], (err, row) => {
            let res = true;

            if (err) {
                reject(err);
            }

            if (row.length === 0) {
                res = false;
            }

            resolve(res);
        })
    })

}
// Добавление учителя в базу данных (true - если удалось добавить, false - если нет)

function addTeacher(login, password) {
    return new Promise((resolve, reject) => {
        let res = false;

        db.run('INSERT INTO Teacher(Login, Password) VALUES (?, ?)', [login, password], function(err) {
            if (err) {
                console.log(err.message);
                resolve(res)
            }

            res = true;
            resolve(res);
        });
    });
}

function addStudent(login, password, name, surname, groupID) {
    return new Promise((resolve, reject) => {
        let res = false;

        db.run('INSERT INTO Student(Name, Surname, GroupID, Login, Password) VALUES (?, ?, ?, ?, ?)', [name, surname, groupID, login, password], function(err) {
            if (err) {
                console.log(err.message);
                resolve(res)
            }

            res = true;
            resolve(res);
        });
    });
}

// login (0 - Ошибка надо тестить , 1 - если такого нет , 2 - если такой пользователь есть)
function loginT(Login, Password) {
    return new Promise((resolve, reject) => {
        db.all('SELECT Login, Password FROM Teacher WHERE Login = (?) and Password = (?)', [Login, Password], (err, row) => {
            let res = 0;
            if (err) {
                console.log(err.message);
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

function loginS(Login, Password) {
    return new Promise((resolve, reject) => {
        db.all('SELECT Login, Password FROM Student WHERE Login = (?) and Password = (?)', [Login, Password], (err, row) => {
            let res = 0;
            if (err) {
                console.log(err.message);
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

// Добавление класса учителем
async function addClass(classNumber, login) {
    let teacherID = -1;

    await getTeacherIDByLogin(login).then(tmpRes => {
        teacherID = tmpRes;
    });

    return new Promise((resolve, reject) => {

        let res = false;

        db.run('INSERT INTO Class(Number, TeacherID) VALUES (?, ?) ', [classNumber, teacherID], (err) => {
            if (err) {
                console.log(err.message);
                resolve(res);
            }

            res = true;
            resolve(res)
        });
    });
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

// добавление сгенерированной ссылки
async function addLink(hash, link, groupName, teacherID) {
    let groupID = -1;

    await getGroupIDbyNumber(groupName).then(res => {
        groupID = res;
    });

    return new Promise((resolve, reject) => {

        let res = false;

        let sql = "INSERT INTO ZoomLinks (HashLink, Link, 'Group', Teacher) VALUES (?, ?, ?, ?)";
        db.run(sql, [hash, link, groupID, teacherID], (err ,row) => {
            if (err) {
                console.log(err.message);
                resolve(res);
            }

            res = true;
            resolve(res);
        });
    });
}

async function addAtt(studentID, groupName) {
    let groupID = -1;

    await getGroupIDbyNumber(groupName).then(res => {
        groupID = res;
    });
    return new Promise((resolve, reject) => {
        let res = false;
        let sql = "INSERT INTO Attendance (studentid, visited, groupid) values (?,?,?)";

        db.get(sql, [studentID,true,groupID], (err, row) => {
            if (err) {
                resolve(res);
            }
            res = true;
            resolve(res);
        });
    });
}

async function showLink(groupName) {

    let groupID = -1;
    let teacherID = -1;

    await getGroupIDbyNumber(groupName).then(res => {
        groupID = res;
    });

    await getTeacherIDByGroup(groupName).then(res => {
        teacherID = res;
    });

    return new Promise((resolve, reject) => {
        let res  = '';

        let sql = `SELECT Link FROM ZoomLinks WHERE "Group" = (?) AND Teacher = (?)`;

        db.get(sql, [groupID, teacherID], (err, row) => {


            if (err) {
                console.log(err.message);
                resolve(res);
            }

            if (row === undefined) {
                resolve(res)
                return ''
            }
            res = row.Link;
            resolve(res);
        });
    });
}

async function showHashLink(groupName) {

    let groupID = -1;
    let teacherID = -1;

    await getGroupIDbyNumber(groupName).then(res => {
        groupID = res;
    });

    await getTeacherIDByGroup(groupName).then(res => {
        teacherID = res;
    });

    return new Promise((resolve, reject) => {
        let res  = '';
        let sql = `SELECT HashLink FROM ZoomLinks WHERE "Group" = (?) AND Teacher = (?)`;

        db.get(sql, [groupID, teacherID], (err, row) => {

            if (err) {
                console.log(err.message);
                resolve(res);
            }

            res = row.HashLink;
            resolve(res);
        });
    });
}

function getTeacherIDByGroup(groupName) {
    return new Promise((resolve, reject) => {
        let res = -1;

        let sql = "SELECT TeacherID FROM Class WHERE Number = (?)";

        db.get(sql, [groupName], (err, row) => {

            if (err) {
                console.log(err);
                resolve(res);
            }

            res = row.TeacherID;
            resolve(res);
        });
    });
}

async function getCountOfLessonsByGroup(groupID) {

    return new Promise((resolve, reject) => {
        let sql = "SELECT ID FROM Lesson WHERE GroupID = (?)";
        let res = [];

        db.all(sql, [groupID], (err, rows) => {

            if (rows) {
                rows.forEach(row => {
                    res.push(row)
                });
            }

            resolve(res.length);

        });
    });
}

async function getCountOfLessonsByStudent(login) {

    let studentID = -1;

    await getStudentIDByLogin(login).then(res => {
        studentID = res;
    });

    return new Promise((resolve, reject) => {

        let sql = "SELECT LessonID FROM Attendance WHERE StudentID = (?)";
        let res = [];

        db.all(sql, [studentID], (err, rows) => {

            if (rows) {
                rows.forEach(row => {
                    res.push(row)
                });
            }

            resolve(res.length);

        });

    });
}

function getStudentIDByLogin(login) {
    console.log(login);
    return new Promise((resolve, reject) => {

        let sql = "SELECT ID FROM Student WHERE Login = (?)";
        let res = 0;

        db.get(sql, [login], (err, row) => {

            if (err) {
                console.log(err.message);
                resolve(res);
            }


            res = row.ID;
            resolve(res);
        });


    });
}

function getTeacherIDByLogin(login) {
    let sql = "SELECT ID FROM Teacher Where Login = (?)";

    return new Promise((resolve, reject) => {
        
        db.get(sql, [login], function (err, row) {

            if (err) {
                console.log(err.message);
                resolve(null)
            }

            resolve(row.ID);
        });
        
    });
    
}
// вернет пустой массив если нихуя нет или ошибка, или вернет массив данных студентов
function getStudentsByGroup(number) {
    return new Promise((resolve, reject) => {
        let sql = "SELECT Student.Name, Student.Surname, Student.ID FROM Student JOIN Class ON Student.GroupID = Class.ID WHERE Class.Number = (?)"

        let res = [];
        db.all(sql, [number], (err, rows) => {
            if (err) {
                console.log(err.message);
                reject(res);
            }

            rows.forEach(row => {
                res.push(row);
            });

            resolve(res)
        })
    });
}

function getGroupsByTeacher(login) {
    return new Promise((resolve, reject) => {

        let sql = 'SELECT Class.Number, Class.ID FROM Class JOIN Teacher ON Teacher.ID = Class.TeacherID WHERE Teacher.Login = (?)';
        let res = [];

        db.all(sql, [login], (err, rows) => {
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

function getGroupsByStudent(login) {
    return new Promise((resolve, reject) => {

        let sql = 'SELECT Class.Number, Class.ID FROM Class JOIN Student ON Student.GroupID = Class.ID WHERE Student.Login = (?)';
        let res = [];

        db.all(sql, [login], (err, rows) => {
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

function checkLink(hashLink) {
    return new Promise(resolve => {
        let sql = "SELECT * FROM ZoomLinks WHERE HashLink = (?)";
        let res = false;

        db.all(sql, [hashLink], (err, row) => {
            if (err) {
                console.log(err.message);
                resolve(res);
            }

            if (row.length !== 0){
                res = true;
            }
            resolve(res);
        });
    })
}

function setLink(hashLink, realLink, group, teacherLogin) {
    return new Promise(resolve => {
        checkLink(hashLink).then(checked => {
            if(checked === true) {
                let sql = "UPDATE ZoomLinks SET Link = (?) WHERE HashLink = (?)";

                let res = false;

                db.run(sql, [realLink, hashLink], (err) => {
                    if (err) {
                        console.log(err.message);
                        resolve(res);
                    }

                    res = true;
                    resolve(res);
                });
            } else {
                let sql = 'INSERT INTO ZoomLinks ("HashLink", "Link", "Group", "Teacher") VALUES (?, ?, ?, ?)';

                let res = false;

                db.run(sql, [hashLink, realLink, group, teacherLogin], (err) => {
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

function getLinkByHash(hashLink) {
    return new Promise ( resolve => {
       let sql = "SELECT Link FROM ZoomLinks WHERE HashLink = (?)";

       let res = "";

       db.get(sql, [hashLink], (err, row) => {
            if (err) {
                console.log(err);
                resolve(res)
            }

            res = row.Link;
            resolve(res)
       });

    });
}

function getGroupByLinkHash(hashLink) {
    return new Promise ( resolve => {
        let sql = "SELECT Group FROM ZoomLinks WHERE HashLink = (?)";

        let res = "";

        db.get(sql, [hashLink], (err, row) => {
            if (err) {
                console.log(err);
                resolve(res)
            }

            res = row.Link;
            resolve(res)
        });

    });
}

function getTeacherByLinkHash(hashLink) {
    return new Promise ( resolve => {
        let sql = "SELECT Teacher FROM ZoomLinks WHERE HashLink = (?)";

        let res = "";

        db.get(sql, [hashLink], (err, row) => {
            if (err) {
                console.log(err);
                resolve(res)
            }

            res = row.Link;
            resolve(res)
        });

    });
}

function getAllStudents() {

    return new Promise((resolve) => {
        let res = [];
        let sql = "SELECT Name, Surname, Login, Password FROM Student";

        db.all(sql, (err, rows) => {

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

function getStudentsAttendance(studentID) {
    return new Promise ((resolve) => {
        let sql = 'SELECT CAST((SELECT CAST(COUNT(*) as float) CNT\n             FROM Student\n                      JOIN Attendance on Student.ID = Attendance.StudentID\n             WHERE StudentID = (?)\n             GROUP BY StudentID\n             LIMIT 1) / (SELECT CAST(COUNT(L.ID) as float) CNTALL\n                         FROM Student\n                                  JOIN Lesson L on Student.GroupID = L.GroupID\n                         WHERE Student.ID = (?)\n                         GROUP BY Student.ID\n                         LIMIT 1) * 100 as integer) Attendance;';
        let res = [];

        db.all(sql,[studentID, studentID],(err, rows) => {
           if (err) {
               console.log(err.message);
               resolve(res);
           }

           rows.forEach(row => {
                res.push(row)
           });
           resolve(res)
        });
    })
}

function getGroupAttendance(groupID) {
    return new Promise((resolve) => {
        let sql = 'SELECT CAST((SELECT COUNT(S.ID) CNT\n             FROM Student S\n                      JOIN Attendance A on S.ID = A.StudentID\n             WHERE A.GroupID = (?)\n             GROUP BY A.GroupID\n             LIMIT 1) / (SELECT CAST(COUNT(S.ID) AS float) CNTALL\n                         FROM Student S\n                                  JOIN Class C ON S.GroupID = C.ID\n                         WHERE GroupID = (?)\n                         GROUP BY GroupID\n                         LIMIT 1) * 100 as integer) Attendance;';

        db.all(sql,[groupID, groupID],(err, rows) => {
            let res = [];

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

// Для того, чтобы можно было сделать require
module.exports = {
    db,
    loginT,
    loginS,
    teacherRegister,
    addClass,
    addLesson,
    addLink,
    addAtt,
    getStudentsByGroup,
    getGroupsByTeacher,
    getGroupsByStudent,
    getStudentIDByLogin,
    getAllStudents,
    setLink,
    getLinkByHash,
    getGroupByLinkHash,
    getTeacherByLinkHash,
    getTeacherIDByLogin,
    getStudentsAttendance,
    getGroupAttendance,
    getGroupIDbyNumber,
    studentRegister,
    getCountOfLessonsByGroup,
    getCountOfLessonsByStudent,
    showLink,
    showHashLink,
};

