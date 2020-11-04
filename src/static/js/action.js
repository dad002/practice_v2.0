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
			window.currentGroup = groups[0].Number;
			const dropdownMenu = document.querySelector(".dropdown-menu > div")
			if (dropdownMenu) {
				dropdownMenu.innerHTML = "";
				groups.forEach(el => {
					let element = document.createElement("a");
					element.classList.add("dropdown-item");
					element.href = "#";
					element.onclick = () => {
						window.currentGroup = el.Number;
						refresh();
					}
					element.innerText = `Группа ${el.Number}`;
					// element.dataset.number = el.Number
					dropdownMenu.append(element);
				})
				// space-line
				element = document.createElement("div");
				element.classList.add("dropdown-divider");
				dropdownMenu.append(element);
			}
			resolve()
		})
	})
}

function refresh() {
	fetch(`/table_GET?group_num=${window.currentGroup}`, {method: 'GET', credentials: 'include'})
	.then(response => response.json())
	.then(json => {
		const tbody = document.getElementById('tbody_stat')
		const group_num = document.getElementById('gr_num2')
		tbody.innerHTML = ``
		group_num.innerHTML = `№${window.currentGroup}`
		json.forEach((el, idx) => {
			tbody.innerHTML += `
				<tr>
		      		<th scope="row">${idx + 1}</th>
		      		<td>${el.Name}</td>
		      		<td>${el.Surname}</td>
			    </tr>
			`
		})
	})
}

function statsStudents() {
	fetch(`/statsStudents?group_num=${window.currentGroup}`, {method: 'GET', credentials: 'include'})
	.then(response => response.json())
	.then(json => {
		const tbody = document.getElementById('tbody_stat')
		const group_num = document.getElementById('gr_num2')
		tbody.innerHTML = ``
		group_num.innerHTML = `№${window.currentGroup}`
		json.forEach((el, idx) => {
			tbody.innerHTML += `
				<tr>
		      		<th scope="row">${idx + 1}</th>
		      		<td>${el.Name}</td>
		      		<td>${el.Attendance}</td>
			    </tr>			`
		})
		console.log(tbody.innerHTML)
	})
}

function studentStat() {
	let curStat = document.getElementById('curEn')
	let digitStat = document.getElementById('digitStat')
	fetch(`/studentStat?group_num=${window.currentGroup}`, { method: 'GET', credentials: 'include' })
	.then(response => response.json())
	.then( json => {
		let curWidth = json.stat

		curStat.style.width = (98 * curWidth) + '%';
		digitStat.textContent = curWidth.toFixed(3) * 100 + '%'
	} )
	return 0
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
		body: JSON.stringify({groupNum: document.getElementById('grAddInput').value})
		})
	.then(response => response.json())
	.then(json => {
		refresh_gr()
	})
}

function Add_Student() {
	fetch('/AddSt', {method: 'POST',
		credentials: 'include',
		body: JSON.stringify({
			login: document.getElementById('login').value,
			password: document.getElementById('password').value,
			name: document.getElementById('name').value,
			surname: document.getElementById('surname').value,
			groupID: document.getElementById('group').value
		})})
	.then(response => response.json())
}

// запуск refresha при загрузке страницы
window.onload = () => {
	refresh_gr().then(refresh).then(statsStudents)
	document.querySelector(".login").innerHTML = parseCookies().login
	if (document.getElementById('grAddButton')) {
		document.getElementById('grAddButton').onclick = Add_Group
	}
}
// время от времени (1,5 мин) обновляет данные
setInterval(refresh_gr, 10000)
setInterval(() => {
	const cR1 = document.getElementById('customRadio1')
	const cR2 = document.getElementById('customRadio2')

	if (cR1) {
		if (cR1.checked) {
			statsStudents()
		}
		else{
			statsGroups()
		}
	}
	//if (cR1.ch)
}, 10000)
