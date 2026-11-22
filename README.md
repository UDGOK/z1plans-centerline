# z1plans-centerline

Static plan room served at `/centerline/`. No build step.

- `centerline/index.html` is the page.
- `centerline/c.txt` and `centerline/s/*.txt` are encrypted content. They open only with the access code, which is not stored in this repository.
- `vercel.json` sets no-index headers and redirects `/` to `/centerline/`.

To serve it at `z1plans.com/centerline`, add this to the `vercel.json` of the z1plans.com project (replace the host with this project's Vercel URL):

```json
{ "rewrites": [
  { "source": "/centerline", "destination": "https://THIS-PROJECT.vercel.app/centerline/" },
  { "source": "/centerline/:path*", "destination": "https://THIS-PROJECT.vercel.app/centerline/:path*" }
] }
```
