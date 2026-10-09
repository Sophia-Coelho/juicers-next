import app from "../backend/src/app.js";

export default function handler(req, res) {
  const requestUrl = new URL(req.url, `https://${req.headers.host || "localhost"}`);
  const routePath = requestUrl.searchParams.get("path") || "health";
  requestUrl.searchParams.delete("path");

  req.url = `/api/${routePath}${requestUrl.search}`;
  return app(req, res);
}
