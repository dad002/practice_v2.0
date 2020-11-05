const cookies = document.cookie


function action() {
	alert(cookies)
}

function toggleFunction() {
	let toggleBlock = document.getElementById('toggle-block')
	toggleBlock.classList.toggle('hidden')
	toggleBlock.classList.toggle('visible')
	let arrow = document.getElementById('arrow')
	arrow.classList.toggle('right-arrow')
	arrow.classList.toggle('left-arrow')
}

function clientDebug(msg) {
	let content = document.getElementById('content')
	content.textContent += (msg + '\n')
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
	})
}

function statsAllStudents() {
	fetch(`/statsAllStudents`, {method: 'GET', credentials: 'include'})
	.then(response => response.json())
	.then(json => {
		console.log(json)
		const tbody = document.getElementById('tbody_stat')
		tbody.innerHTML = ``
		json.forEach((el, idx) => {
			tbody.innerHTML += `
				<tr>
					<th scope="row">${idx + 1}</th>
					<td>${el.Name}</td>
					<td>${el.Attendance}</td>
				</tr>			`
		})
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

function Add_Lesson() {
	fetch('/AddLs', {
		method: 'POST',
		credentials: 'include',
		body: JSON.stringify({
			groupName: window.currentGroup,
			teacherLogin: document.getElementById('LOGIN').textContent,
			date: document.getElementById('data').value.replace(/\s+/g, '')
		})
	})
	.then(response => response.json())
}

function AddLink() {
	fetch('/AddLink', {
		method: 'POST',
		credentials: 'include',
		body: JSON.stringify({
			hashlink: document.getElementById('link_input').value,
			link: document.getElementById('link').value,
			groupName: window.currentGroup,
			teacherName: document.getElementById('LOGIN').textContent
		})
	})
	.then(response => response.json())
}

function getLink() {
	fetch(`/GetLink?group_num=${window.currentGroup}`, { method: 'GET', credentials: 'include' })
	.then(response => response.json())
	.then(json => {
		document.getElementById('linkToCheck').value = json
	})
}

// запуск refresha при загрузке страницы
window.onload = () => {
	refresh_gr().then(statsStudents)
	document.querySelector(".login").innerHTML = parseCookies().login
	if (document.getElementById('grAddButton')) {
		document.getElementById('grAddButton').onclick = Add_Group
	}
}
// время от времени (1,5 мин) обновляет данные
setInterval(() => {
	if (document.getElementById("linkToCheck").value === null) {
		getLink()
	}
	// if (document.getElementById("group").value !== null) {
	// 	statsAllStudents()
	// }
}, 1000)
setInterval(refresh_gr, 3000)
setInterval(statsAllStudents, 3000)

