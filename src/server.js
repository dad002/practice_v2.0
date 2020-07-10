const http = require('http');
// модуль для запуска веб-сервера
const fs = require('fs');
// модуль для работы с файлами
const url = require('url') // Для обработки URL

const html_log = fs.readFileSync('src/static/index.html')
const html_reg = fs.readFileSync('src/static/reg.html')
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

const server = http.createServer((req, res) => {
    // свойства объекта req
    console.log(`${req.method} ${req.url}`);
    // console.log(req.headers);

    const cookies = parseCookies(req);

    const urlObject = url.parse(req.url, true, false)

    switch (urlObject.pathname) {
        case '/':  // Экран входа
            if (req.method === "POST") {
                // TODO: Обработать, существует ли пользователь
                let login, password; // TODO
                res.writeHead(200, {
                    'Set-Cookie': `login=${login};password=${password}`,
                    'Location': '/main.html'  // Переадресация через заголовок
                })
                res.end("<script>location.href = \"/main.html\"</script>") // На всякий случай переадресация через JS
                break;
            }
            res.writeHead(200, {'Content-Type': 'text/html'}); // plain - в случае обычного текста
            res.end(html_log)
            break;
        case '/style.css':
            res.writeHead(200, {'Content-Type': 'text/css'}); // plain - в случае обычного текста
            res.end(css)
            break
        case '/action.js':
            res.writeHead(200, {'Content-Type': 'text/javascript'}); // plain - в случае обычного текста
            res.end(js);
            break
        case '/reg.html':  // Экран регистрации
            if (req.method === "POST") {
                let postData = "";

                req.on("data", chunk => postData += chunk);

                req.on("end", () => {
                    var postDataObject = JSON.parse(postData)

                    // TODO: Обработать и добавить пользователя в базу данных.
                    let login = postDataObject.login, password = postDataObject.password; // TODO: Проверить
                    let success = true; // TODO: Здесь результат регистрации. Успех или нет.

                    // Если успех - переадресуем на /main.html
                    if (success) {
                        res.writeHead(200, {
                            'Set-Cookie': `login=${login};password=${password}`,
                            'Location': '/main.html'  // Переадресация через заголовок
                        })
                        res.end("<script>location.href = \"/main.html\"</script>") // На всякий случай переадресация через JS
                    } else {  // Если не успех - возвращаем обратно
                        res.writeHead(200, {'Content-Type': 'text/html'}); // plain - в случае обычного текста
                        res.end(html_reg);
                    }
                })

                break;
            }
            res.writeHead(200, {'Content-Type': 'text/html'}); // plain - в случае обычного текста
            res.end(html_reg)
            break
        case '/main.html':
            // TODO: Проверить, правильные ли логин и пароль
            const login = cookies.login;
            const password = cookies.password;

            res.writeHead(200, {'Content-Type': 'text/html'}); // plain - в случае обычного текста
            res.end(html_reg)
            break
        default:
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end("<h1>Error 404: NOT FOUND</h1>")
    }

}).listen(5000, () => console.log(`Сервер запущен: http://` +
    `${server.address().address === "::" ? "localhost" : server.address().address}:${server.address().port}`
))
// запуск веб-сервера

