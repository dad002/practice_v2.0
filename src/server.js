const http = require('http'); // модуль для запуска веб-сервера
const fs = require('fs'); // модуль для работы с файлами
const url = require('url'); // Для обработки URL
const axios = require("axios")
const randomName = require("random-name")

const database = require('./database');  // Импортируем нашу БД

var crypto = require('crypto');

var port = process.env.PORT || 5000;

const html_log = fs.readFileSync('src/static/index.html')
const html_reg = fs.readFileSync('src/static/reg.html')
const html_main = fs.readFileSync('src/static/main.html')
const html_link = fs.readFileSync('src/static/link_midl.html')
const html_admin = fs.readFileSync('src/static/html_admin.html')
const html_student = fs.readFileSync('src/static/html_student.html')

const css = fs.readFileSync('src/static/css/style.css')
const js = fs.readFileSync('src/static/js/action.js')

const bg = fs.readFileSync('src/img/bg.jpg')

// Парсить куки
function parseCookies(request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function (cookie) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

// Парсить POST данные
function parsePost(rc) {
    var list = {}

    rc && rc.split('&').forEach(function (cookie) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}



// async функция-обработчик запросов чтобы можно было юзать await
const server = http.createServer(async (req, res) => {
    // свойства объекта req
    console.log(`${req.method} ${req.url}`);

    const cookies = parseCookies(req);

    const urlObject = url.parse(req.url, true, false)

    const login = cookies.login;
    const password = cookies.password;

    switch (urlObject.pathname) {
        case '/':  // Экран входа
            if (req.method === "POST") {
                // Получаем данные POST запроса

                let postData = "";

                req.on("data", chunk => postData += chunk)

                req.on("end", async () => {
                    // Получили все данные, идём дальше

                    // Парсим данные из POST запроса
                    var postDataObject = parsePost(postData)

                    // Берём из них логин и пароль
                    let login = postDataObject.login, password = postDataObject.password;

                    // Чекаем логин
                    let resultT = await database.loginT(login, password);
                    let resultS = await database.loginS(login, password);

                    let successT = resultT === 2; // Если 2, значит такой юзер есть
                    let successS = resultS === 2;

                    // Если успех - переадресуем на /main.html
                    if (successT || successS) {
                        console.debug("Логин: успешно")
                        res.setHeader('Set-Cookie', [`login=${login}`, `password=${password}`, `type=${successT ? 'teacher' : 'student'}`]);
                        if (login === 'admin') {
                            res.setHeader('Location', '/html_admin');  // переадресация
                            res.end("<script>location.href = \"/html_admin\"</script>") // На всякий случай переадресация через JS
                        }
                        else {
                            if (successS) {
                                console.log("You're student")
                                res.setHeader('Location', '/html_student');
                                res.end("<script>location.href = \"/html_student\"</script>");
                            } else {
                                console.log("You're teacher")
                                res.setHeader('Location', '/main');  // переадресация
                                res.end("<script>location.href = \"/main\"</script>") // На всякий случай переадресация через JS
                            }
                        }
                    } else {  // Если не успех - возвращаем обратно
                        console.debug("Логин: Не успешно")
                        res.writeHead(401, {'Content-Type': 'text/html', 'res-msg':'Err'}); // plain - в случае обычного текста
                        res.end(html_log);
                    }
                });
                break;
            }
            // Если не POST, просто даём страницу входа
            res.writeHead(200, {'Content-Type': 'text/html'}); // plain - в случае обычного текста
            res.end(html_log)
            break;
        case '/style.css':
            res.writeHead(200, {'Content-Type': 'text/css'}); // plain - в случае обычного текста
            res.end(css)
            break
        case '/action.js':
            res.writeHead(200, {'Content-Type': 'text/javascript'}); // plain - в случае обычного текста
            res.end(js)
            break
        case '/assets/img/bg.jpg':
            res.writeHead(200, {'Content-Type': 'img'}); // plain - в случае обычного текста
            res.end(bg)
            break
        case '/reg':  // Экран регистрации
            if (req.method === "POST") {
                let postData = "";

                req.on("data", chunk => postData += chunk)

                req.on("end", async () => {
                    // Получили все данные, идём дальше
                    // Парсим данные из POST запроса
                    var postDataObject = parsePost(postData)

                    let login = postDataObject.Login
                    let password = postDataObject.Password;

                    let success = await database.teacherRegister(login, password); // Регистрируем пользователя и true/false используем как успешность

                    // Если успех - переадресуем на /main.html
                    if (success) {
                        console.debug("Успешная регистрация")
                        res.setHeader('Set-Cookie', [`login=${login}`, `password=${password}`]);
                        res.setHeader('Location', '/main');
                        console.debug("Вы зарегистрировались под лоигонм и паролем: " + login + " - " + password)
                        res.end("<script>location.href = \"/main\"</script>") // На всякий случай переадресация через JS
                    } else {  // Если не успех - возвращаем обратно
                        console.debug("Ошибка регистрации")
                        res.writeHead(200, {'Content-Type': 'text/html'}); // plain - в случае обычного текста
                        res.end(html_reg);
                    }
                });
                break;
            }
            res.writeHead(200, {'Content-Type': 'text/html'}); // plain - в случае обычного текста
            res.end(html_reg);
            break;
        case '/main':

            // Проверяем, правильные ли логин и пароль. Если нет - выкидываем на страницу логина
            if (cookies.login === 'admin') {
                res.writeHead(200, {'Content-Type': 'text/html'}); // plain - в случае обычного текста
                res.end(html_admin)
            }

            res.writeHead(200, {'Content-Type': 'text/html'}); // plain - в случае обычного текста
            res.end(html_main)

            break

        case '/html_admin':

            // Проверяем, правильные ли логин и пароль. Если нет - выкидываем на страницу логина
            if (2 !== await database.loginT(login, password) && !(await database.isAdmin(login))) {
                console.debug("Неизвестный пользователь, выкидываем на логин")
                res.writeHead(200, {'Location': '/', 'Content-Type': 'text/html'});
                res.end("<script>location.href = \"/\"</script>") // На всякий случай переадресация через JS
                break;
            }

            res.writeHead(200, {'Content-Type': 'text/html'}); // plain - в случае обычного текста
            res.end(html_admin)

            break

        case '/html_student':

            // Проверяем, правильные ли логин и пароль. Если нет - выкидываем на страницу логина
            if (cookies.login === 'admin') {
                res.writeHead(200, {'Content-Type': 'text/html'}); // plain - в случае обычного текста
                res.end(html_admin)
            }

            res.writeHead(200, {'Content-Type': 'text/html'}); // plain - в случае обычного текста
            res.end(html_student)

            break

        case '/table_GET':

            // Проверяем, правильные ли логин и пароль. Если нет - выкидываем на страницу логина
            if (2 !== await database.login(cookies.login, cookies.password)) {
                res.writeHead(200, {'Location': '/', 'Content-Type': 'text/html'});
                res.end("<script>location.href = \"/\"</script>") // На всякий случай переадресация через JS
                break;
            }

            const students_table = await database.getStudentsByGroup(urlObject.query.group_num);
            res.writeHead(200, {'Content-Type': 'text/json'})

            res.end(JSON.stringify(students_table))

            break

        case '/table_gr_GET':

            // Проверяем, правильные ли логин и пароль. Если нет - выкидываем на страницу логина

            let groups_table
            if (cookies.type === 'teacher') {
                groups_table = await database.getGroupsByTeacher(cookies.login);
            }
            else {
                groups_table = await database.getGroupsByStudent(cookies.login);
            }
            /*console.log(groups_table)*/
            res.writeHead(200, {'Content-Type': 'text/json'});

            res.end(JSON.stringify(groups_table));

            break;

        case '/link_midl':
            let studentID = -1
            await database.getStudentIDByLogin(cookies.login)
            .then(res => {
                studentID = res
            })
            console.log("LinkMiddle: " + studentID + ", " + urlObject.query.group_num)
            database.addAtt(studentID, urlObject.query.group_num)

            res.statusCode = 200
            res.setHeader("Content-Type", "text/html");
            res.setHeader("Location", await database.showHashLink(urlObject.query.group_num))
            res.end(`<script>window.location.href = "${await database.showHashLink(urlObject.query.group_num)}"</script>`)
            break

        case '/create_link':

            if (req.method !== 'POST')
                break;

            let postData_ = "";

            req.on("data", chunk => postData_ += chunk)
            req.on("end", async () => {
                // Получили все данные, идём дальше

                // console.debug(postData)

                // Парсим данные из POST запроса
                var postDataObject = JSON.parse(postData_)
                //
                let start_hash = cookies.login + '_' + postDataObject.group
                var hash = crypto.createHash('md5').update(start_hash).digest('hex');
                let res_link = '/link_midl?group_num=' + postDataObject.group + "&" + hash

                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end(res_link)
            });

            break

        case '/statsGroup':
            // Проверяем, правильные ли логин и пароль. Если нет - выкидываем на страницу логина
            if (2 !== await database.login(cookies.login, cookies.password)) {
                res.writeHead(200, {'Location': '/', 'Content-Type': 'text/html'});
                res.end("<script>location.href = \"/\"</script>") // На всякий случай переадресация через JS
                break;
            }

            const groupStats = [];
            const groups = await database.getGroupsByTeacher(cookies.login);

            for (let i = 0; i < groups.length; i++) {
                const group = groups[i].ID;
                const attendance = (await database.getGroupAttendance(group))[0].Attendance
                groupStats.push({
                    GroupID: groups[i].Number,
                    Attendance: (attendance === null ? 0 : attendance) + "%"
                })
            }

            res.writeHead(200, {'Content-Type': 'text/json'});
            res.end(JSON.stringify(groupStats))

            break

        case '/statsStudents':

            const studentStats = [];
            let students = await database.getStudentsByGroup(urlObject.query.group_num);

            for (let i = 0; i < students.length; i++) {
                let student = students[i]
                let attendance = (await database.getStudentsAttendance(student.ID))[0].Attendance;
                studentStats.push({
                    Name: `${student.Name} ${student.Surname}`,
                    Attendance: (attendance === null ? 0 : attendance) + '%'
                })
            }

            res.writeHead(200, {'Content-Type': 'text/json'});
            res.end(JSON.stringify(studentStats))

            break

        case '/statsAllStudents':

            const statsAllStudents = [];
            let allStudents = await database.getAllStudents();

            for (let i = 0; i < allStudents.length; i++) {
                let student = allStudents[i]
                let attendance = (await database.getStudentsAttendance(student.ID))[0].Attendance;
                statsAllStudents.push({
                    Name: `${student.Name} ${student.Surname}`,
                    Attendance: (attendance === null ? 0 : attendance) + '%'
                })
            }

            res.writeHead(200, {'Content-Type': 'text/json'});
            res.end(JSON.stringify(statsAllStudents))

            break

        case '/studentStat':

            let studentLogin = cookies.login
            const group = await database.getGroupIDbyNumber(urlObject.query.group_num);
            const result = await database.getCountOfLessonsByStudent(studentLogin) / await database.getCountOfLessonsByGroup(group)

            const studentStat = {stat: result}

            res.writeHead(200, {'Content-Type': 'text/json'});
            res.end(JSON.stringify(studentStat))

            break

        case '/AddGr':
            if (req.method !== 'POST')
                break;

            let ngr_dataPOST = "";

            req.on("data", chunk => ngr_dataPOST += chunk)
            req.on("end", async () => {
                // Получили все данные, идём дальше

                // Парсим данные из POST запроса
                var postDataObject = JSON.parse(ngr_dataPOST)
                console.log(postDataObject)
                const new_group = await database.addClass(postDataObject.groupNum, cookies.login)

                res.writeHead(200, {'Content-Type': 'text/json'});
                res.end(JSON.stringify(new_group))
            });
            break

        case '/AddSt':
            if (req.method !== 'POST')
                break;

            let nst_dataPOST = "";

            req.on("data", chunk => nst_dataPOST += chunk)
            req.on("end", async () => {
                // Получили все данные, идём дальше

                // Парсим данные из POST запроса
                var postDataObject = JSON.parse(nst_dataPOST)
                console.log(postDataObject)
                const new_student = await database.studentRegister(
                    postDataObject.login,
                    postDataObject.password,
                    postDataObject.name,
                    postDataObject.surname,
                    postDataObject.groupID
                )

                res.writeHead(200, {'Content-Type': 'text/json'});
                res.end(JSON.stringify(new_student))
            });
            break

        case '/AddLs':

            if (req.method !== 'POST')
                break;

            let nls_dataPOST = "";

            req.on("data", chunk => nls_dataPOST += chunk)
            req.on("end", async () => {
                // Получили все данные, идём дальше

                // Парсим данные из POST запроса
                var postDataObject = JSON.parse(nls_dataPOST)
                console.log(postDataObject)
                const new_lesson = await database.addLesson(
                    await database.getGroupIDbyNumber(postDataObject.groupName ),
                    await database.getTeacherIDByLogin(postDataObject.teacherLogin),
                    postDataObject.date
                );

                res.writeHead(200, {'Content-Type': 'text/json'});
                res.end(JSON.stringify(new_lesson))
            });

            break

        case '/AddLink':
            if (req.method !== 'POST')
                break;

            let nlink_dataPOST = "";

            req.on("data", chunk => nlink_dataPOST += chunk)
            req.on("end", async () => {
                // Получили все данные, идём дальше

                // Парсим данные из POST запроса
                var postDataObject = JSON.parse(nlink_dataPOST)
                const new_link = await database.addLink(
                    postDataObject.hashlink,
                    postDataObject.link,
                    postDataObject.groupName,
                    await database.getTeacherIDByLogin(postDataObject.teacherName)
                )

                res.writeHead(200, {'Content-Type': 'text/json'});
                res.end(JSON.stringify(new_link))
            })

            break

        case '/GetLink':

            let link = "###"
            await database.showLink(urlObject.query.group_num)
            .then(res => {
                link = res;
            });

            res.writeHead(200, {'Content-Type': 'text/json'});
            res.end(JSON.stringify(link))

            break

        default:
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(`<h1>Error 404: NOT FOUND</h1>`)
    }

}).listen(port, () => console.log(`Сервер запущен: http://` +
    `${server.address().address === "::" ? "localhost" : server.address().address}:${server.address().port}`
));
