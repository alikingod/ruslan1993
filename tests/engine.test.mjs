import test from "node:test";
import assert from "node:assert/strict";
import {
  calendar,
  play,
  initialGame,
  won,
  finalReady,
  achievements,
} from "../src/engine.mjs";
test("Возраст до, в день и после дня рождения; будущие годы", () => {
  assert.equal(calendar(new Date(2026, 11, 27, 12)).age, 32);
  assert.deepEqual(calendar(new Date(2026, 11, 28, 12)), {
    age: 33,
    birthday: true,
    days: 0,
  });
  assert.equal(calendar(new Date(2026, 11, 29)).age, 33);
  assert.equal(calendar(new Date(2026, 11, 29)).days, 364);
  assert.equal(calendar(new Date(2031, 11, 28)).age, 38);
  assert.equal(calendar(new Date(2028, 1, 29)).age, 34);
});
test("Победа и все игровые достижения достижимы на каждой сложности", () => {
  for (const d of [1, 2, 3]) {
    let g = { ...initialGame };
    for (const action of ["thicken", "floc", "rusya"]) g = play(g, action, d);
    assert.equal(g.combo, "tfr");
    for (let i = 0; i < 3; i++) g = play(g, "floc", d);
    for (let i = 0; i < 4; i++) g = play(g, "rusya", d);
    assert.ok(won(g));
    assert.ok(g.floc >= 3);
    assert.equal(g.authority, 100);
  }
});
test("Аварийная кнопка меняет игру, значения остаются в пределах шкал", () => {
  let g = play(initialGame, "alarm", 3);
  assert.ok(g.chaos > initialGame.chaos);
  assert.ok(g.stability < initialGame.stability);
  for (let i = 0; i < 50; i++) g = play(g, "alarm", 3);
  assert.equal(g.chaos, 100);
  assert.equal(g.stability, 0);
  assert.equal(g.density, 0);
});
test("Финал требует три независимых задания", () => {
  assert.equal(finalReady([]), false);
  assert.equal(finalReady(["pulp", "student"]), false);
  assert.equal(finalReady(["pulp", "student", "call"]), true);
  assert.equal(
    new Set(achievements.map((a) => a.id)).size,
    achievements.length,
  );
});
