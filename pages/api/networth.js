import puppeteer from 'puppeteer';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

    const { name } = req.body;

    if (!name) return res.status(400).json({ error: 'Celebrity name is required.' });

    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        const query = name.trim().split(' ').join('-').toLowerCase();
        const url = `https://www.celebritynetworth.com/richest-celebrities/${query}-net-worth/`;

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const netWorthText = await page.$eval('.value', el => el.textContent);

        await browser.close();

        // Convert net worth text to number
        // Example: "$400 Million" => 400000000
        const match = netWorthText.match(/\$([\d.,]+)\s*(Billion|Million)/i);
        if (!match) {
            return res.status(404).json({ error: 'Net worth not found.' });
        }

        const amount = parseFloat(match[1].replace(/,/g, ''));
        const multiplier = match[2].toLowerCase() === 'billion' ? 1e9 : 1e6;
        const netWorth = amount * multiplier;

        return res.status(200).json({ netWorth }); // in USD
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch net worth.' });
    }
}
