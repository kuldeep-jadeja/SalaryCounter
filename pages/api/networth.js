import puppeteer from 'puppeteer';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Celebrity name is required' });

    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(name + ' site:celebritynetworth.com')}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

        const link = await page.$eval('a[href*="celebritynetworth.com"]', el => el.href);
        if (!link) throw new Error('No net worth page found');

        await page.goto(link, { waitUntil: 'domcontentloaded' });

        const netWorthText = await page.evaluate(() => {
            const el = document.querySelector('div:has(h2):not(:has(div))');
            return el?.innerText || null;
        });

        await browser.close();

        if (!netWorthText) throw new Error('Net worth not found');

        // Extract amount (e.g., "$200 Million")
        const match = netWorthText.match(/\$([\d,.]+)\s*(Million|Billion)/i);
        if (!match) throw new Error('Unable to parse net worth');

        const number = parseFloat(match[1].replace(/,/g, ''));
        const multiplier = match[2].toLowerCase() === 'billion' ? 1_000_000_000 : 1_000_000;
        const netWorthUSD = number * multiplier;

        return res.status(200).json({ netWorthUSD });
    } catch (err) {
        console.error('Scraping error:', err);
        return res.status(500).json({ error: err.message });
    }
}
