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

const css = fs.readFileSync('src/static/css/style.css')

const js = fs.readFileSync('src/static/js/action.js')

const ClientID = 'sOOeFevFTcqagteoLkNYsg'
const ClientSecret = 'yRqRLVV5jR35FS71aNuM7QVEZsWrmdQf'
const redirect_uri = "https://127.0.0.1:5000/link_midl.html"

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
    // console.log(req.headers);

    const cookies = parseCookies(req);

    const urlObject = url.parse(req.url, true, false)

    switch (urlObject.pathname) {
        case '/':  // Экран входа
            if (req.method === "POST") {
                // Получаем данные POST запроса

                let postData = "";

                req.on("data", chunk => postData += chunk)

                req.on("end", async () => {
                    // Получили все данные, идём дальше

                    // console.debug(postData)

                    // Парсим данные из POST запроса
                    var postDataObject = parsePost(postData)

                    // Берём из них логин и пароль
                    let login = postDataObject.login, password = postDataObject.password;

                    // Чекаем логин
                    let result = await database.login(login, password);

                    let success = result === 2; // Если 2, значит такой юзер есть

                    // Если успех - переадресуем на /main.html
                    if (success) {
                        console.debug("Логин: успешно")
                        res.setHeader('Location', '/main.html');  // переадресация
                        res.setHeader('Set-Cookie', [`login=${login}`, `password=${password}`]);
                        res.end("<script>location.href = \"/main.html\"</script>") // На всякий случай переадресация через JS
                    } else {  // Если не успех - возвращаем обратно
                        console.debug("Логин: Не успешно")
                        res.writeHead(200, {'Content-Type': 'text/html'}); // plain - в случае обычного текста
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
        case '/reg.html':  // Экран регистрации
            if (req.method === "POST") {
                let postData = "";

                req.on("data", chunk => postData += chunk)

                req.on("end", async () => {
                    // Получили все данные, идём дальше

                    // console.debug(postData)

                    // Парсим данные из POST запроса
                    var postDataObject = parsePost(postData)

                    let login = postDataObject.login, password = postDataObject.password;

                    let success = await database.register(login, password); // Регистрируем пользователя и true/false используем как успешность

                    // Если успех - переадресуем на /main.html
                    if (success) {
                        console.debug("Успешная регистрация")
                        res.setHeader('Location', '/main.html');
                        res.setHeader('Set-Cookie', [`login=${login}`, `password=${password}`]);
                        res.end("<script>location.href = \"/main.html\"</script>") // На всякий случай переадресация через JS
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
        case '/main.html':
            const login = cookies.login;
            const password = cookies.password;

            // Проверяем, правильные ли логин и пароль. Если нет - выкидываем на страницу логина
            if (2 !== await database.login(login, password)) {
                console.debug("Неизвестный пользователь, выкидываем на логин")
                res.writeHead(200, {'Location': '/', 'Content-Type': 'text/html'});
                res.end("<script>location.href = \"/\"</script>") // На всякий случай переадресация через JS
                break;
            }

            res.writeHead(200, {'Content-Type': 'text/html'}); // plain - в случае обычного текста
            res.end(html_main)
            break
        case '/testPOST':
            if (req.method !== 'POST') // Если не пост, шлём нахуй
                break;
            // Получаем данные POST запроса

            let postData = "";

            req.on("data", chunk => postData += chunk)

            req.on('end', async () => {
                let data = JSON.parse(postData);

                data.one = 'two'

                res.writeHead(200, {'Content-Type': 'text/json'})
                res.end(JSON.stringify(data))
            })

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
            if (2 !== await database.login(cookies.login, cookies.password)) {
                res.writeHead(200, {'Location': '/', 'Content-Type': 'text/html'});
                res.end("<script>location.href = \"/\"</script>") // На всякий случай переадресация через JS
                break;
            }

            const groups_table = await database.getGroupsByTeacher(cookies.login);
            res.writeHead(200, {'Content-Type': 'text/json'});

            res.end(JSON.stringify(groups_table))

            break;

        case '/link_midl.html':
            if (cookies.id !== undefined) {
                database.checkIn(cookies.id, urlObject.query.i)

                res.statusCode = 200
                res.setHeader("Content-Type", "text/html");
                res.setHeader("Location", await database.getLinkByHash(urlObject.query.i))
                res.end(`<script>window.location.href = "${await database.getLinkByHash(urlObject.query.i)}"</script>`)
                break
            }

            console.debug("Not redirecting")

            if (urlObject.query.test !== undefined) {
                const user = {
                    first_name: randomName.first(),
                    last_name: randomName.last(),
                    id: Math.round(Math.random() * 1000000000),
                    group: await database.getGroupByLinkHash(cookies.i)
                }

                await database.addStudent(user.first_name, user.last_name, user.id, user.group)

                res.setHeader("Set-Cookie", `id=${user.id}`)
                res.statusCode = 200
                res.setHeader("Content-Type", "text/html");
                res.setHeader("Location", await database.getLinkByHash(cookies.i))
                res.end(`<script>window.location.href = "${await database.getLinkByHash(cookies.i)}"</script>`)
                break;
            }

            let accessToken;

            if (urlObject.query.code) {
                try {
                    const response = await axios({
                        url: "https://zoom.us/oauth/token",
                        method: "POST",
                        headers: {
                            "Authorization": "Basic " + Buffer.from(`${ClientID}:${ClientSecret}`, "utf-8").toString("base64")
                        },
                        params: {
                            grant_type: "authorization_code",
                            code: urlObject.query.code,
                            redirect_uri: redirect_uri
                        }
                    })
                    const data = response.data
                    accessToken = data.access_token;
                } catch (err) {
                    console.error(err)
                }

                const resp = await axios({
                    url: "https://api.zoom.us/v2/users/me",
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                })
                const data = resp.data;

                const user = {
                    first_name: data.first_name,
                    last_name: data.last_name,
                    id: data.id,
                    group: await database.getGroupByLinkHash(cookies.i)
                }

                await database.addStudent(user.first_name, user.last_name, user.id, user.group)

                res.setHeader("Set-Cookie", `id=${data.id}`)
                res.statusCode = 200
                res.setHeader("Content-Type", "text/html");
                res.setHeader("Location", await database.getLinkByHash(cookies.i))
                res.end(`<script>window.location.href = "${await database.getLinkByHash(cookies.i)}"</script>`)
                break;
            }

            res.statusCode = 200
            res.setHeader("Content-Type", "text/html");
            res.setHeader("Set-Cookie", `i=${urlObject.query.i}`)
            res.end(html_link)
            break

        case '/create_link':

            if (req.method !== 'POST') // Если не пост, шлём нахуй
                break;

            let postData_ = "";

            req.on("data", chunk => postData_ += chunk)
            req.on("end", async () => {
                // Получили все данные, идём дальше

                // console.debug(postData)

                // Парсим данные из POST запроса
                var postDataObject = JSON.parse(postData_)

                let start_hash = cookies.login + '_' + postDataObject.group
                var hash = crypto.createHash('md5').update(start_hash).digest('hex');
                let res_link = '/link_midl.html?i=' + hash

                await database.setLink(hash, postDataObject.link, postDataObject.group, cookies.login)

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

            console.log(groupStats)
            res.writeHead(200, {'Content-Type': 'text/json'});
            res.end(JSON.stringify(groupStats))

            break

        case '/statsStudents':
            // Проверяем, правильные ли логин и пароль. Если нет - выкидываем на страницу логина
            // if (2 !== await database.login(cookies.login, cookies.password)) {
            //     res.writeHead(200, {'Location': '/', 'Content-Type': 'text/html'});
            //     res.end("<script>location.href = \"/\"</script>") // На всякий случай переадресация через JS
            //     break;
            // }


            const group = await database.getGroupIDbyNumber(urlObject.query.group_num);

            const studentStats = [];
            let students = await database.getStudentsByGroup(urlObject.query.group_num);

            console.log(students)

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

        default:
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end("<h1>Error 404: NOT FOUND</h1>")
    }

}).listen(port, () => console.log(`Сервер запущен: http://` +
    `${server.address().address === "::" ? "localhost" : server.address().address}:${server.address().port}`
));
// запуск веб-сервера


