const cookies = document.cookie


function action() {
	alert(cookies)
}

function test() {
	var xhr = new XMLHttpRequest();

	var body = 'name=' + encodeURIComponent(name) +
		'surname=' + encodeURIComponent(surname);

	xhr.open("POST", '/submit', true);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

	xhr.send(body);
}