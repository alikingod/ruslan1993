export const KEY = "rusya1993-v1";
export function calendar(now = new Date()) {
  const birthday = now.getMonth() === 11 && now.getDate() === 28;
  const age =
    now.getFullYear() -
    1993 -
    (now.getMonth() < 11 || (now.getMonth() === 11 && now.getDate() < 28)
      ? 1
      : 0);
  let next = new Date(now.getFullYear(), 11, 28);
  if (now >= new Date(now.getFullYear(), 11, 29))
    next = new Date(now.getFullYear() + 1, 11, 28);
  return {
    age,
    birthday,
    days: Math.max(0, Math.ceil((next.getTime() - now.getTime()) / 86400000)),
  };
}
export const initialGame = {
  density: 18,
  stability: 70,
  chaos: 15,
  authority: 0,
  floc: 0,
  moves: 0,
  combo: "",
};
export function play(g, action, difficulty = 1) {
  let n = { ...g, moves: g.moves + 1, combo: (g.combo + action[0]).slice(-3) };
  if (action === "thicken") {
    n.density += 14;
    n.stability -= 5 * difficulty;
    n.chaos += 4 * difficulty;
  }
  if (action === "floc") {
    n.density += 8;
    n.stability += 18;
    n.chaos -= 12;
    n.floc++;
  }
  if (action === "rusya") {
    n.density += 22;
    n.stability += 12;
    n.chaos -= 22;
    n.authority += 25;
  }
  if (action === "alarm") {
    n.density -= 18;
    n.stability -= 20;
    n.chaos += 30;
  }
  for (const k of ["density", "stability", "chaos", "authority"])
    n[k] = Math.max(0, Math.min(100, n[k]));
  return n;
}
export const won = (g) => g.density >= 90 && g.stability >= 70 && g.chaos <= 20;
export const finalReady = (ids) =>
  ["pulp", "student", "call"].every((id) => ids.includes(id));
export const achievements = [
  {
    id: "pulp",
    name: "Повелитель пульпы",
    hint: "Выполните задание симулятора.",
  },
  {
    id: "student",
    name: "Ученик легенды",
    hint: "Пройдите все пять вопросов академии.",
  },
  {
    id: "floc",
    name: "Укротитель флокулянта",
    hint: "Добавьте флокулянт три раза за смену.",
  },
  { id: "call", name: "Русю вызывали?", hint: "Свяжитесь с наставником." },
  {
    id: "century",
    name: "Сгущение века",
    hint: "Завершите симулятор на сложности «Легенда».",
  },
  {
    id: "secret",
    name: "Секретный сотрудник",
    hint: "Найдите секрет в логотипе или досье.",
    hidden: true,
  },
  {
    id: "patience",
    name: "Терпение легенды",
    hint: "Позвоните пять раз подряд.",
    hidden: true,
  },
  {
    id: "birth",
    name: "Свидетель рождения легенды",
    hint: "Поздравьте Русю в праздничном режиме.",
    hidden: true,
  },
  {
    id: "combo",
    name: "Физика вышла из чата",
    hint: "Сгустить → флокулянт → Руся.",
    hidden: true,
  },
  {
    id: "wisdom",
    name: "Молчание наставника",
    hint: "Удерживайте печать в досье две секунды.",
    hidden: true,
  },
];
