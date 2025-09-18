import express from "express";
import cors from "cors";
import { promises as fs } from "fs";
import path from "path";

type Id = number;
interface Item {
  id: Id;
  nombre: string;
  cantidad: number;
  precio?: number;
  categoria?: string;
}

const app = express();
app.use(cors());
app.use(express.json());

const file = path.resolve("data/inventario.json");

async function leer(): Promise<Item[]> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as Item[];
  } catch {
    return [];
  }
}
async function escribir(arr: Item[]): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(arr, null, 2), "utf8");
}

app.get("/api/items", async (_req, res) => {
  res.json(await leer());
});

app.post("/api/items", async (req, res) => {
  const body = req.body as Partial<Item>;
  const id = Number(body.id);
  const nombre = String(body.nombre ?? "");
  const cantidad = Number(body.cantidad);
  const precio = body.precio !== undefined ? Number(body.precio) : undefined;
  const categoria =
    body.categoria !== undefined ? String(body.categoria) : undefined;
  if (!Number.isInteger(id) || id <= 0 || !nombre || !Number.isFinite(cantidad))
    return res.status(400).json({ error: "datos" });
  const arr = await leer();
  const i = arr.findIndex((x) => x.id === id);
  if (i >= 0) {
    arr[i].cantidad += cantidad;
    if (precio !== undefined) arr[i].precio = precio;
    if (categoria !== undefined) arr[i].categoria = categoria;
    await escribir(arr);
    return res.status(200).json({ accion: "sumado", item: arr[i] });
  } else {
    const nuevo: Item = { id, nombre, cantidad };
    if (precio !== undefined) nuevo.precio = precio;
    if (categoria !== undefined) nuevo.categoria = categoria;
    arr.push(nuevo);
    await escribir(arr);
    return res.status(201).json({ accion: "creado", item: nuevo });
  }
});

app.put("/api/items/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as Partial<Item>;
  const arr = await leer();
  const i = arr.findIndex((x) => x.id === id);
  if (i === -1) return res.status(404).json({ error: "noexiste" });
  const nombre = body.nombre ?? arr[i].nombre;
  const cantidad = body.cantidad ?? arr[i].cantidad;
  const precio = body.precio ?? arr[i].precio;
  const categoria = body.categoria ?? arr[i].categoria;
  arr[i] = { id, nombre, cantidad, precio, categoria };
  await escribir(arr);
  res.json(arr[i]);
});

app.delete("/api/items/:id", async (req, res) => {
  const id = Number(req.params.id);
  const arr = await leer();
  const i = arr.findIndex((x) => x.id === id);
  if (i === -1) return res.status(404).json({ error: "noexiste" });
  const del = arr.splice(i, 1)[0];
  await escribir(arr);
  res.json(del);
});

app.listen(3000, () => console.log("API http://localhost:3000"));
