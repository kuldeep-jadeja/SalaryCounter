import puppeteer from 'puppeteer';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Celebrity name is required.' });

    const launchOptions = {
        executablePath: puppeteer.executablePath(),
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };

    let browser;

    try {
        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        // ---------- TRY CELEBRITYNETWORTH.COM FIRST ----------
        try {
            const query = name.trim().split(' ').join('-').toLowerCase();
            const url = `https://www.celebritynetworth.com/richest-celebrities/${query}-net-worth/`;

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            const netWorthText = await page.$eval('.value', el => el.textContent);

            const match = netWorthText.match(/\$([\d.,]+)\s*(Billion|Million)/i);
            if (match) {
                const amount = parseFloat(match[1].replace(/,/g, ''));
                const multiplier = match[2].toLowerCase() === 'billion' ? 1e9 : 1e6;
                const netWorth = amount * multiplier;

                await browser.close();
                return res.status(200).json({ netWorth, source: 'celebritynetworth.com' });
            }
        } catch (err) {
            console.warn('CelebrityNetWorth.com scraping failed, trying Google fallback...');
        }

        // ---------- FALLBACK: GOOGLE SEARCH ----------
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(name + ' net worth')}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

        const fallbackText = await page.evaluate(() => {
            const spans = Array.from(document.querySelectorAll('span'));
            const netWorthSpan = spans.find(el => {
                return /\$[\d,.]+\s*(Million|Billion)/i.test(el.textContent);
            });
            return netWorthSpan?.textContent || null;
        });

        if (!fallbackText) {
            throw new Error('Could not extract net worth from fallback search');
        }

        const fallbackMatch = fallbackText.match(/\$([\d.,]+)\s*(Billion|Million)/i);
        if (!fallbackMatch) throw new Error('Unable to parse net worth from Google result');

        const fallbackAmount = parseFloat(fallbackMatch[1].replace(/,/g, ''));
        const fallbackMultiplier = fallbackMatch[2].toLowerCase() === 'billion' ? 1e9 : 1e6;
        const fallbackNetWorth = fallbackAmount * fallbackMultiplier;

        await browser.close();
        return res.status(200).json({ netWorth: fallbackNetWorth, source: 'google' });

    } catch (err) {
        if (browser) await browser.close();
        console.error('Scraping error:', err);
        return res.status(500).json({ error: 'Failed to fetch net worth.' });
    }
}
