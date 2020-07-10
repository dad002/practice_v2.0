const cookies = document.cookie


function action() {
	alert(cookies)
}

function parseCookies() {
	var list = {},
		rc = document.cookie;

	rc && rc.split(';').forEach(function (cookie) {
		var parts = cookie.split('=');
		list[parts.shift().trim()] = decodeURI(parts.join('='));
	});

	return list;
}


function refresh_gr() {
	return new Promise(resolve => {
		fetch(`/table_gr_GET`, {method: 'GET', credentials: 'include'})
		.then(response => response.json())
		.then(groups => {
			window.currentGroup = groups[0];
			const dropdownMenu = document.querySelector(".dropdown-menu")
			dropdownMenu.innerHTML = "";
			groups.forEach(el => {
			  let element = document.createElement("a");
			  element.classList.add("dropdown-item");
			  element.href = "#";
			  element.onclick = () => {
			    window.currentGroup = el;
			    refresh();
			  }
			  element.innerText = `Группа ${el}`
			  dropdownMenu.append(element);
			})
			resolve()
		})
	})
}


function refresh() {
	fetch(`/table_st_GET?group_num=${window.currentGroup}`, {method: 'GET', credentials: 'include'})
	.then(response => response.json())
	.then(json => {
		const tbody = document.getElementById('tbody')
		const group_num = document.getElementById('gr_num')
		tbody.innerHTML = ``
		group_num.innerHTML = `№${window.currentGroup}`
		json.forEach((el, idx) => {
			tbody.innerHTML += `
				<tr>
		      		<th scope="row">${idx + 1}</th>
		      		<td>${el.Name}</td>
		      		<td>${el.Surname}</td>
		      		<td>${el.Zoom}</td>
			    </tr>
			`
		})
	})
}

function statsStudents() {
	fetch(`/statsStudents?group_num=${window.currentGroup.Number}`, {method: 'GET', credentials: 'include'})
	.then(response => response.json())
	.then(json => {
		const tbody = document.getElementById('tbody_stat')
		const group_num = document.getElementById('gr_num')
		tbody.innerHTML = ``
		group_num.innerHTML = `№${window.currentGroup}`
		json.forEach((el, idx) => {
			tbody.innerHTML += `
				<tr>
		      		<th scope="row">${idx + 1}</th>
		      		<td>${el.Name}</td>
		      		<td>${el.Attends}</td>
			    </tr>
			`
		})
	})
}

function statsGroups() {
	fetch(`/statsGroups`, {method: 'GET', credentials: 'include'})
	.then(response => response.json())
	.then(json => {
		const tbody = document.getElementById('tbody_stat')
		json.forEach((el, idx) => {
			tbody.innerHTML += `
				<tr>
		      		<th scope="row">${idx + 1}</th>
		      		<td>${el.GroupID}</td>
		      		<td>${el.Attends}</td>
			    </tr>
			`
		})
	})
}

function create_link() {
	const inp_link = document.getElementById('link_input')
	const red_link = inp_link.value
	fetch('/create_link', {method: 'POST',
		credentials: 'include',
		body: JSON.stringify({link: red_link, group: window.currentGroup})})
	.then(response => response.text())
	.then(text => {
		document.getElementById('link').value = window.location.origin + text
	})
}

// запуск refresha при загрузке страницы
window.onload = () => {
	refresh_gr().then(refresh)
	document.querySelector(".login").innerHTML = parseCookies().login
}
// время от времени (1,5 мин) обновляет данные
setInterval(refresh, 90000)
setInterval(refresh_gr, 300000)
