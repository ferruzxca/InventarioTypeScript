type Id = number;

interface Item {
  id: Id;
  nombre: string;
  cantidad: number;
  precio?: number;
  categoria?: string;
}

const API = "http://localhost:3000/api/items";

const $ = <T extends HTMLElement>(s: string) =>
  document.querySelector(s) as T | null;
const must = <T extends HTMLElement>(el: T | null, name: string): T => {
  if (!el) throw new Error(name);
  return el;
};

const idInp = must(
  $("#id") as HTMLInputElement | null,
  "#id"
) as HTMLInputElement;
const nomInp = must(
  $("#nombre") as HTMLInputElement | null,
  "#nombre"
) as HTMLInputElement;
const cantInp = must(
  $("#cantidad") as HTMLInputElement | null,
  "#cantidad"
) as HTMLInputElement;
const precInp = must(
  $("#precio") as HTMLInputElement | null,
  "#precio"
) as HTMLInputElement;
const catInp = must(
  $("#categoria") as HTMLInputElement | null,
  "#categoria"
) as HTMLInputElement;

const btnCrear = must(
  $("#crear") as HTMLButtonElement | null,
  "#crear"
) as HTMLButtonElement;
const btnAct = must(
  $("#actualizar") as HTMLButtonElement | null,
  "#actualizar"
) as HTMLButtonElement;
const btnLimpiar = must(
  $("#limpiar") as HTMLButtonElement | null,
  "#limpiar"
) as HTMLButtonElement;

const lista = must(
  $("#lista") as HTMLTableSectionElement | null,
  "#lista"
) as HTMLTableSectionElement;
const msg = must($("#msg") as HTMLDivElement | null, "#msg") as HTMLDivElement;
const form = must(
  document.getElementById("form") as HTMLFormElement | null,
  "#form"
) as HTMLFormElement;

const kpiItems = must(
  $("#kpi-items") as HTMLDivElement | null,
  "#kpi-items"
) as HTMLDivElement;
const kpiUnidades = must(
  $("#kpi-unidades") as HTMLDivElement | null,
  "#kpi-unidades"
) as HTMLDivElement;
const kpiValor = must(
  $("#kpi-valor") as HTMLDivElement | null,
  "#kpi-valor"
) as HTMLDivElement;

const buscar = must(
  $("#buscar") as HTMLInputElement | null,
  "#buscar"
) as HTMLInputElement;
const ordenSel = must(
  $("#orden") as HTMLSelectElement | null,
  "#orden"
) as HTMLSelectElement;

function n(x: string): number | null {
  const v = Number(x);
  return Number.isFinite(v) ? v : null;
}
function limpiar(): void {
  form.reset();
  idInp.focus();
}
function money(v: number | undefined): string {
  return typeof v === "number" && Number.isFinite(v)
    ? `$${v.toFixed(2)}`
    : "$0.00";
}
function mensaje(texto: string, tipo: "ok" | "error"): void {
  msg.textContent = texto;
  msg.className = tipo;
  msg.style.display = "block";
  window.setTimeout(() => {
    msg.style.display = "none";
    msg.textContent = "";
    msg.className = "";
  }, 1600);
}

async function apiList(): Promise<Item[]> {
  const r = await fetch(API);
  if (!r.ok) throw new Error("api");
  return r.json();
}
async function apiCreateOrSum(i: Item): Promise<"creado" | "sumado"> {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(i),
  });
  if (!r.ok) throw new Error("api");
  const data = (await r.json()) as { accion: "creado" | "sumado"; item: Item };
  return data.accion;
}
async function apiUpdate(i: Item): Promise<void> {
  const r = await fetch(`${API}/${i.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(i),
  });
  if (!r.ok) throw new Error("api");
}
async function apiDelete(id: Id): Promise<void> {
  const r = await fetch(`${API}/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error("api");
}

function leerFormulario(): Item | null {
  const id = n(idInp.value.trim());
  const nombre = nomInp.value.trim();
  const cantidad = n(cantInp.value.trim());
  const precio =
    precInp.value.trim() === ""
      ? undefined
      : n(precInp.value.trim()) ?? undefined;
  const categoria =
    catInp.value.trim() === "" ? undefined : catInp.value.trim();
  if (!id || !Number.isInteger(id) || id <= 0) return null;
  if (!nombre) return null;
  if (cantidad === null) return null;
  const it: Item = { id, nombre, cantidad };
  if (precio !== undefined) it.precio = precio;
  if (categoria !== undefined) it.categoria = categoria;
  return it;
}

function filtrarOrdenar(arr: Item[]): Item[] {
  const q = buscar.value.trim().toLowerCase();
  let out = arr;
  if (q)
    out = out.filter(
      (x) =>
        x.nombre.toLowerCase().includes(q) ||
        (x.categoria ?? "").toLowerCase().includes(q)
    );
  const k = ordenSel.value;
  out.sort((a, b) => {
    if (k === "id") return a.id - b.id;
    if (k === "nombre") return a.nombre.localeCompare(b.nombre);
    if (k === "cantidad") return (a.cantidad ?? 0) - (b.cantidad ?? 0);
    if (k === "precio") return (a.precio ?? 0) - (b.precio ?? 0);
    return 0;
  });
  return out;
}

function refrescarKPIs(arr: Item[]): void {
  const items = arr.length;
  const unidades = arr.reduce((s, x) => s + (x.cantidad ?? 0), 0);
  const valor = arr.reduce(
    (s, x) => s + (x.precio ?? 0) * (x.cantidad ?? 0),
    0
  );
  kpiItems.textContent = String(items);
  kpiUnidades.textContent = String(unidades);
  kpiValor.textContent = `$${valor.toFixed(2)}`;
}

async function render(): Promise<void> {
  const arr = await apiList();
  const view = filtrarOrdenar(arr);
  refrescarKPIs(arr);
  lista.innerHTML = "";
  for (const it of view) {
    const tr = document.createElement("tr");
    const total = (it.precio ?? 0) * (it.cantidad ?? 0);
    tr.innerHTML = `
      <td>${it.id}</td>
      <td>${it.nombre}</td>
      <td>${it.cantidad}</td>
      <td>${it.precio !== undefined ? money(it.precio) : ""}</td>
      <td>${it.categoria ?? ""}</td>
      <td>${money(total)}</td>
      <td>
        <button class="tbtn" data-editar="${it.id}">Editar</button>
        <button class="tbtn" data-eliminar="${it.id}">Eliminar</button>
      </td>`;
    lista.appendChild(tr);
  }
}

btnCrear.addEventListener("click", async () => {
  const it = leerFormulario();
  if (!it) {
    mensaje("Datos incompletos", "error");
    return;
  }
  try {
    const accion = await apiCreateOrSum(it);
    await render();
    if (accion === "creado") {
      limpiar();
      mensaje("Creado", "ok");
    } else {
      limpiar();
      mensaje("Cantidad sumada", "ok");
    }
  } catch {
    mensaje("Error", "error");
  }
});

btnAct.addEventListener("click", async () => {
  const it = leerFormulario();
  if (!it) {
    mensaje("Datos incompletos", "error");
    return;
  }
  try {
    await apiUpdate(it);
    await render();
    limpiar();
    mensaje("Actualizado", "ok");
  } catch {
    mensaje("Error", "error");
  }
});

btnLimpiar.addEventListener("click", () => {
  limpiar();
});

lista.addEventListener("click", async (e) => {
  const t = e.target as HTMLElement;
  const eid = t.getAttribute("data-editar");
  const did = t.getAttribute("data-eliminar");
  if (eid) {
    const id = Number(eid);
    const arr = await apiList();
    const it = arr.find((x) => x.id === id);
    if (!it) {
      mensaje("ID no existe", "error");
      return;
    }
    idInp.value = String(it.id);
    nomInp.value = it.nombre;
    cantInp.value = String(it.cantidad ?? 0);
    precInp.value = it.precio !== undefined ? String(it.precio) : "";
    catInp.value = it.categoria ?? "";
    mensaje("Cargado", "ok");
  } else if (did) {
    const id = Number(did);
    try {
      await apiDelete(id);
      await render();
      mensaje("Eliminado", "ok");
    } catch {
      mensaje("Error", "error");
    }
  }
});

buscar.addEventListener("input", () => {
  render();
});
ordenSel.addEventListener("change", () => {
  render();
});

render();
