Place your hero image file here so the homepage can use it as a background.

Steps:
1. Create a directory `public/images` inside the `frontend` folder if it does not exist.
2. Save the attached image as `hero.jpg` into `frontend/public/images/hero.jpg`.
3. Start the dev server:

```bash
cd frontend
npm run dev
```

The homepage will reference the image at `/images/hero.jpg` and show it as the hero background.

If you prefer a different filename, update the `backgroundImage` URL in `src/pages/index.tsx`.
