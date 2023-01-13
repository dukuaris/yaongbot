const express = require('express')
require('dotenv').config()
const cors = require('cors')
const { Configuration, OpenAIApi } = require('openai')
const { Translate } = require('@google-cloud/translate').v2

const translate = new Translate({
	projectId: 'catalk at',
	key: process.env.GOOGLE_API_KEY,
})

const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

const app = express()
app.use(cors())
app.use(express.json())

async function promptTrans(prompt_origin) {
	let [detections] = await translate.detect(prompt_origin)
	const target = detections.language

	let prompt

	if (target !== 'en') {
		const [prompts] = await translate.translate(prompt_origin, 'en')
		prompt = prompts
	} else {
		prompt = prompt_origin
	}

	return prompt
}

app.get('/', async (req, res) => {
	res.status(200).send({
		message: 'Hello from Codex',
	})
})

app.post('/image', async (req, res) => {
	const { prompt_origin, size } = req.body
	const imageSize =
		size === '1' ? '256x256' : size === '2' ? '512x512' : '1024x1024'

	let [detections] = await translate.detect(prompt_origin)
	const target = detections.language

	let prompt

	if (target !== 'en') {
		const [prompts] = await translate.translate(prompt_origin, 'en')
		prompt = prompts
	} else {
		prompt = prompt_origin
	}

	try {
		const response = await openai.createImage({
			prompt,
			n: 1,
			size: imageSize,
		})

		const imageUrl = response.data.data[0].url

		res.status(200).json({
			success: true,
			data: imageUrl,
		})
	} catch (error) {
		if (error.response) {
			console.log(error.response.status)
			console.log(error.response.data)
		} else {
			console.log(error.message)
		}

		res.status(400).json({
			success: false,
			error: 'The image could not be generated',
		})
	}
})

app.post('/', async (req, res) => {
	const prompt_origin = req.body.prompt

	let [detections] = await translate.detect(prompt_origin)
	const target = detections.language

	let prompt

	if (target !== 'en') {
		const [prompts] = await translate.translate(prompt_origin, 'en')
		prompt = prompts
	} else {
		prompt = prompt_origin
	}

	try {
		const response = await openai.createCompletion({
			model: 'text-davinci-003',
			prompt: `${prompt}`,
			temperature: 0,
			max_tokens: 3000,
			top_p: 1,
			frequency_penalty: 0.5,
			presence_penalty: 0,
		})

		const text = response.data.choices[0].text

		if (target !== 'en') {
			let [translations] = await translate.translate(text, target)
			translations = Array.isArray(translations) ? translations : [translations]
			res.status(200).send({
				bot: translations[0].trim(),
			})
		} else {
			res.status(200).send({
				bot: text,
			})
		}
	} catch (error) {
		console.log(error)
		res.status(500).send({ error })
	}
})

app.listen(5001, () =>
	console.log('Server is running on port http://localhost:5001')
)
