import { createCanvas } from 'canvas';
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

    const { salary, duration, fontSize, color, currency } = req.body;

    const salaryPerSecond = salary / (365 * 24 * 60 * 60);
    const fps = 30;
    const width = 1280;
    const height = 720;

    const folder = path.join(tmpdir(), `frames_${uuidv4()}`);
    await fs.mkdir(folder);

    try {
        for (let i = 0; i < duration * fps; i++) {
            const t = i / fps;
            const amount = `${currency}${(salaryPerSecond * t).toFixed(2)}`;

            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, width, height); // Transparent background

            ctx.fillStyle = '#00FF66'; // Green text
            ctx.font = `${fontSize}px Arial`;
            const textWidth = ctx.measureText(amount).width;
            ctx.fillText(amount, (width - textWidth) / 2, height / 2);

            const buffer = canvas.toBuffer('image/png');
            await fs.writeFile(path.join(folder, `frame_${String(i).padStart(5, '0')}.png`), buffer);
        }

        const outputPath = path.join(tmpdir(), `salary_output_${uuidv4()}.webm`);

        await new Promise((resolve, reject) => {
            const ffmpeg = spawn(ffmpegPath, [
                '-framerate', String(fps),
                '-i', path.join(folder, 'frame_%05d.png'),
                '-c:v', 'libvpx',
                '-pix_fmt', 'yuva420p',
                '-auto-alt-ref', '0',
                '-y', outputPath,
            ]);

            ffmpeg.stderr.on('data', (d) => console.log(d.toString()));
            ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`))));
        });

        const file = await fs.readFile(outputPath);
        res.setHeader('Content-Type', 'video/webm');
        res.setHeader('Content-Disposition', 'attachment; filename="salary-counter.webm"');
        res.send(file);

        // Optionally clean up:
        // await fs.rm(folder, { recursive: true, force: true });
        // await fs.unlink(outputPath);
    } catch (err) {
        console.error('Error generating video:', err);
        res.status(500).json({ error: err.message });
    }
}
