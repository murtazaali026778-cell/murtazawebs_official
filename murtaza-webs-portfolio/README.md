# Murtaza Webs Portfolio

A responsive portfolio starter with a Three.js hero scene and GSAP scroll reveals.

## Run locally
Because `script.js` uses JavaScript modules and an import map, run it through a local server (not by double-clicking the HTML file).

```bash
# Option 1
npx vite

# Option 2
python -m http.server 5500
```
Then open the local URL shown by the server.

## Customize before publishing
- Replace `hello@murtaza.dev` with your real contact email.
- Replace the sample project URLs and descriptions with your actual projects.
- Keep skill labels honest and only list tools you can explain and use.
- Add your real GitHub, LinkedIn, and Instagram links if you want social links.
- Deploy the folder to Vercel or Netlify.

## Notes
- Three.js is loaded from unpkg via an import map.
- GSAP and ScrollTrigger are loaded from cdnjs.
- If WebGL is unavailable, the rest of the portfolio remains usable.
- The 3D scene pauses when it is off-screen or the browser tab is hidden.
