import bot from './assets/bot.png'
import user from './assets/user.png'

const form = document.querySelector('form')
const chatContainer = document.querySelector('#chat_container')

let loadInterval

function loader(element) {
	element.textContent = ''

	loadInterval = setInterval(() => {
		element.textContent += '.'

		if (element.textContent === '....') {
			element.textContent = ''
		}
	}, 300)
}

function typeText(element, text) {
	let index = 0

	let interval = setInterval(() => {
		if (index < text.length) {
			element.innerHTML += text.charAt(index)
			index++
		} else {
			clearInterval(interval)
		}
	}, 20)
}

function generateUniqueId() {
	const timestamp = Date.now()
	const randomNumber = Math.random()
	const hexadecimalString = randomNumber.toString(16)

	return `id-${timestamp}-${hexadecimalString}`
}

function chatStripe(isAi, value, uniqueId) {
	return `
      <div class="wrapper ${isAi && 'ai'}">
          <div class="chat">
              <div class="profile">
                  <img 
                    src=${isAi ? bot : user} 
                    alt="${isAi ? 'bot' : 'user'}" 
                  />
              </div>
              <div class="message" id=${uniqueId}>${value}</div>
          </div>
      </div>
  `
}

async function imageAi(prompt, size) {
	const response = await fetch('https://yaongbot.onrender.com/image', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			prompt_origin: prompt,
			size,
		}),
	})
	return response
}

async function chatAi(prompt) {
	const response = await fetch('https://yaongbot.onrender.com', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			prompt,
		}),
	})

	return response
}

const handleSubmit = async (e) => {
	e.preventDefault()

	const data = new FormData(form)
	let prompt = data.get('prompt')
	const imageReq = prompt.slice(0, 3)
	const is_image =
		imageReq === '@1@' || imageReq === '@2@' || imageReq === '@3@'

	if (prompt === '') {
		alert('Please add some text')
		return
	}

	// user's chatstript
	chatContainer.innerHTML += chatStripe(false, prompt)

	form.reset()

	// bot's chatstript
	const uniqueId = generateUniqueId()
	chatContainer.innerHTML += chatStripe(true, ' ', uniqueId)

	chatContainer.scrollTop = chatContainer.scrollHeight

	const messageDiv = document.getElementById(uniqueId)

	loader(messageDiv)

	//check the message to request an image
	if (is_image) {
		const size = prompt.slice(1, 2)
		const rePrompt = prompt.slice(3).trim()
		console.log(size)
		// fetch data from Dalle 2 server
		const response = await imageAi(rePrompt, size)

		console.log(response)

		clearInterval(loadInterval)
		messageDiv.innerHTML = ''

		if (!response.ok) {
			throw new Error('That image could not be generated')
		}

		const data = await response.json()

		const imageUrl = data.data

		messageDiv.innerHTML = `
					<img src="${imageUrl}" alt="" id="image" />
		`
	} else {
		// fetch data from chatGPT server
		const response = await chatAi(prompt)

		clearInterval(loadInterval)
		messageDiv.innerHTML = ''

		if (response.ok) {
			const data = await response.json()
			const parsedData = data.bot.trim()

			typeText(messageDiv, parsedData)
		} else {
			const err = await response.text()

			messageDiv.innerText = 'Something went wrong'

			alert(err)
		}
	}
}

form.addEventListener('submit', handleSubmit)
form.addEventListener('keyup', (e) => {
	e.preventDefault()
	if (e.keyCode === 13) {
		handleSubmit(e)
	}
})
