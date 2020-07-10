const http = require('http'); // модуль для запуска веб-сервера
const fs = require('fs'); // модуль для работы с файлами
const url = require('url'); // Для обработки URL

const database = require('./database');  // Импортируем нашу БД

const html_log = fs.readFileSync('src/static/index.html')
const html_reg = fs.readFileSync('src/static/reg.html')
const html_main = fs.readFileSync('src/static/main.html')
const css = fs.readFileSync('src/static/css/style.css')
const js = fs.readFileSync('src/static/js/action.js')

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
        default:
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end("<h1>Error 404: NOT FOUND</h1>")
    }

}).listen(5000, () => console.log(`Сервер запущен: http://` +
    `${server.address().address === "::" ? "localhost" : server.address().address}:${server.address().port}`
));
// запуск веб-сервера


