import fs from 'fs/promises'
import { parse } from 'node-html-parser'

const baseUrl = `http://steen.free.fr/interslavic`
async function build() {
	for (const ver of ['', 'c']) {
		const response = await fetch(`${baseUrl}/ms${ver}-en.html`)
		const body = parse(await response.text())
		const table = body.querySelectorAll('#dict table p')
		const words = table.map(el => el.childNodes.map(node => [node.tagName, node.innerText || node.data]))
		await fs.writeFile(`./dist/words_${ver || 'l'}.json`, JSON.stringify(words), 'utf8')
	}
}

build()
