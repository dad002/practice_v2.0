const cookies = document.cookie


function action() {
	alert(cookies)
}

/*function addStudent() {
	fetch('/AddSt', {method: 'POST',
		credentials: 'include',
		body: JSON.stringify({groupNum: document.querySelector('#navbarSupportedContent > ul > li > div > input').value})
	})
		.then(response => response.json())
		.then(json => {
			refresh_gr()
			// document.getElementById('link').value = window.location.origin + text
		})
}*/

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
			  element.innerText = `Группа ${el.Number}`
			  dropdownMenu.append(element);
			})  
			// space-line
			element = document.createElement("div");
			element.classList.add("dropdown-divider");
			dropdownMenu.append(element);

			// input line
			element = document.createElement("input");
			element.classList.add("form-control");
			element.classList.add("bar_func");
			element.classList.add("m-b10px");
			element.classList.add("m-t10px");
			dropdownMenu.append(element);

			// button Add
			element = document.createElement("button");
			/*element.classList.add("btn");
			element.classList.add("btn-success");
			element.classList.add("ml-17p");
			element.classList.add("bar_func");*/
			element.type = 'button'
			element.onclick = Add_Group
			element.innerText = `Add Group`
			dropdownMenu.append(element);

			resolve()
		})
	})
}


function refresh() {
	fetch(`/table_GET?group_num=${window.currentGroup.Number}`, {method: 'GET', credentials: 'include'})
	.then(response => response.json())
	.then(json => {
		const tbody = document.getElementById('tbody')
		const group_num = document.getElementById('gr_num')
		tbody.innerHTML = ``
		group_num.innerHTML = `№${window.currentGroup.Number}`
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
		const group_num = document.getElementById('gr_num2')
		tbody.innerHTML = ``
		group_num.innerHTML = `№${window.currentGroup.Number}`
		json.forEach((el, idx) => {
			tbody.innerHTML += `
				<tr>
		      		<th scope="row">${idx + 1}</th>
		      		<td>${el.Name}</td>
		      		<td>${el.Attendance}</td>
			    </tr>
			`
		})
	})
}

function statsGroups() {
	fetch(`/statsGroup`, {method: 'GET', credentials: 'include'})
	.then(response => response.json())
	.then(json => {
		const tbody = document.getElementById('tbody_stat')
		tbody.innerHTML = ``
		const group_num = document.getElementById('gr_num2')
		group_num.innerHTML = `#`
		json.forEach((el, idx) => {
			tbody.innerHTML += `
				<tr>
		      		<th scope="row">${idx + 1}</th>
		      		<td>${el.GroupID}</td>
		      		<td>${el.Attendance}</td>
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

function Add_Group() {
	fetch('/AddGr', {method: 'POST', 
		credentials: 'include',
		body: JSON.stringify({groupNum: document.querySelector('#navbarSupportedContent > ul > li > div > input').value})
		})
	.then(response => response.json())
	.then(json => {
		refresh_gr()
		// document.getElementById('link').value = window.location.origin + text
	})
}

// запуск refresha при загрузке страницы
window.onload = () => {
	refresh_gr().then(refresh).then(statsStudents)
	document.querySelector(".login").innerHTML = parseCookies().login
	
}
// время от времени (1,5 мин) обновляет данные
setInterval(refresh, 90000)
setInterval(refresh_gr, 10000)
setInterval(() => {
	const cR1 = document.getElementById('customRadio1')
	const cR2 = document.getElementById('customRadio2')

	if (cR1.checked) {
		statsStudents()
	}
	else{
		statsGroups()
	}
	//if (cR1.ch)
}, 1000)
