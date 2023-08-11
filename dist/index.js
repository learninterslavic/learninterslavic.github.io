const [main] = document.getElementsByClassName('main')
const [wordEl] = document.getElementsByClassName('word')
const [colorEl] = document.getElementsByClassName('color')
const [descriptionEl] = document.getElementsByClassName('description')
const [wordListEl] = document.getElementsByClassName('wordList')
const [intervalEl] = document.getElementsByClassName('selectedInterval')
const [currentIntervalEl] = document.getElementsByClassName('currentInterval')

let interval = 800
let paused = false
let pausedAt = Date.now()
let pauseInterval = 0
intervalEl.innerHTML = interval

let wordTimer
let descriptionTimer

class Timer {
	constructor(callback, delay) {
		this.remaining = delay
		this.callback = callback
		this.timerId = undefined
		this.start = undefined
		this.resume()
	}

	pause() {
		window.clearTimeout(this.timerId)
		this.timerId = null
		this.remaining -= Date.now() - this.start
	}

	resume() {
		if (this.timerId) {
			return
		}

		if (this.remaining < 0) return

		this.start = Date.now()
		this.timerId = window.setTimeout(this.callback, this.remaining)
	}
}

const intervals = []

document.addEventListener('keypress', e => {
	if (e.key === ' ') {
		paused = !paused
		if (paused) {
			pausedAt = Date.now()
			wordTimer.pause()
			descriptionTimer.pause()
		} else {
			pauseInterval = Date.now() - pausedAt
			wordTimer.resume()
			descriptionTimer.resume()
		}
	}
})
document.addEventListener('wheel', e => {
	interval = Math.max(80, interval - Math.floor(e.deltaY * 0.8))
	intervalEl.innerHTML = interval
})

async function init(ver = 'c') {
	const response = await fetch(`words_${ver}.json`)
	const words = await response.json()
	const wordCount = words.length

	const randomWord = () => words[Math.floor(Math.random() * wordCount)]
	let color = Math.random() * 360

	const tick = () => {
		const [[_, word], ___, [__, form], ...description] = randomWord()

		const nextColor = (color + 75) % 360

		const colorVal = `hsl(${Math.floor(color)}, 100%, 50%)`
		const nextColorVal = `hsl(${Math.floor(nextColor)}, 100%, 50%)`

		const start = Date.now()
		let progress = 100

		currentInterval = interval + JSON.stringify(description).length * 10
		currentIntervalEl.innerHTML = currentInterval
		wordEl.innerHTML = `<b>${word}</b>`
		const width = wordEl.clientWidth

		descriptionEl.innerHTML = `<i>${form}</i>`

		const getStyle = () =>
			`width: ${width}px; background: linear-gradient(90deg, ${colorVal} 0%, ${colorVal} ${progress - 5}%, ${nextColorVal} ${
				progress + 5
			}%, ${nextColorVal} 100%);`
		colorEl.style = getStyle()

		const updateColorInterval = () => {
			colorEl.style = getStyle()
			if (!paused) {
				const pauseDiff = pausedAt - start
				const mod = pauseDiff > 0 ? pauseInterval : 0
				progress = (1 - (Date.now() - start - mod) / currentInterval) * 100
			}
			if (progress > 0) requestAnimationFrame(updateColorInterval)
		}
		requestAnimationFrame(updateColorInterval)

		descriptionTimer = new Timer(() => {
			const lastNode = wordListEl.childNodes[20]
			if (lastNode) wordListEl.removeChild(lastNode)
			const newNode = document.createElement('div')
			newNode.innerText = word
			wordListEl.prepend(newNode)

			const val = description
				.filter(([_, text]) => text.trim())
				.map(([tagName, rawText]) => {
					const tag = tagName?.toLowerCase()
					const text = rawText.replace(/([,;]) /gm, '$1<br>')
					return tagName ? `<${tag}>${text}</${tag}>` : text
				})
				.join('<br>')
			wordEl.innerHTML = val
			descriptionEl.innerHTML = ''
		}, currentInterval / 2)

		wordTimer = new Timer(tick, currentInterval)
		color = nextColor
	}

	setTimeout(() => tick(), interval)
}

init()
