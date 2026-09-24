// Собирает chessjax-inline.js из chessjax.js — версию для обычного
// (не module) <script>, которую вставляют в страницу целиком.
//
// Зачем вообще две версии: chessjax.js — ES-модуль с `export`, его
// подключают как <script type="module">. Но вставка «в лоб» на страницу, где
// модули неудобны, требует файла без единого `export` и без `import.meta` —
// второй в обычном скрипте это синтаксическая ошибка, а не undefined.
//
// Правила ровно три, и все три — механические:
//   1. Срезать `export` из объявлений и убрать финальный `export { … }` /
//      `export default`.
//   2. Объявить `MODULE_BASE` вверху: это тот же адрес, что в модуле берётся
//      из location (страница подключает ../chessjax.js, и адрес страницы не
//      равен каталогу модуля) — в обычном скрипте его заменяет
//      document.currentScript. Сам резолв в chessjax.js уже написан через
//      currentScript — именно чтобы эта строка переезжала в inline без правок.
//   3. Ничего больше. Ничего не минифицировать: у владельца незрячий
//      пользователь читает исходники на слух, и однострочный бандл хуже
//      читается в Git.
//
// Почему скрипт, а не ручная правка: до него inline-версия собиралась руками
// и разъехалась. В chessjax.js резолв звука давно переписан на
// document.currentScript (и комментарий это объясняет), а в inline оставался
// прежний код — то есть тесты гоняли не тот файл, который публикуется.
// Расхождение молчаливое: обе версии выглядят рабочими.
//
//   node build-inline.mjs
//
// и вслед за ним тесты, которым нужен именно этот файл:
//   node test-a11y.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, "chessjax.js");
const OUT = join(here, "chessjax-inline.js");

// В chessjax.js каталог звуков задаётся явным data-sound-base, никакой
// константы с адресом собирать не надо. Проверка осталась как страховка от
// возврата: если кто-то снова заведёт адрес через document.currentScript,
// сборка упадёт здесь, а не отдаст бандл с молча неверной базой.
const NO_BASE_MARK = "document.currentScript";

let src = readFileSync(SRC, "utf8");

// 1. Модульный синтаксис.
src = src.replace(/^export default chessjax;\s*$/m, ""); // хвост модуля
src = src.replace(/^export \{[^}]*\};\s*$/m, ""); // сводный реэкспорт
src = src.replace(/^export (const|function|class|async function|let|var) /gm, "$1 ");

// 2. Константа с адресом — она уже есть в исходнике, поэтому только проверяем.
const anchor = /^(const RANKS = .*;)$/m;
if (!anchor.test(src)) {
  console.error("build-inline: не нашёл const RANKS — файл изменился, проверка устарела.");
  process.exit(1);
}
if (src.replace(/^\s*(\/\/|\/\*|\*).*$/gm, "").includes(NO_BASE_MARK)) {
  console.error(
    `build-inline: в chessjax.js снова появился «${NO_BASE_MARK}» — адрес модуля ` +
      "так не определяется (в модуле он null). Задавай каталог звуков через data-sound-base."
  );
  process.exit(1);
}

// 3. Страховка. Собранный файл не должен содержать module-синтаксиса: иначе он
//    падает у пользователя синтаксической ошибкой, а не работает тихо.
//    Ищем только настоящий код, не упоминания в комментариях: строки,
//    начинающиеся с // (или /*), не считаем.
const code = src.replace(/^\s*(\/\/|\/\*|\*).*$/gm, "");
const leftovers = code.match(/^\s*export |\bimport\.meta\b/gm);
if (leftovers) {
  console.error(
    `build-inline: в результате остался module-синтаксис (${leftovers.join(", ")}). ` +
      "Добавь правило в скрипт, не правь файл руками."
  );
  process.exit(1);
}

writeFileSync(OUT, src);
console.log(`chessjax-inline.js обновлён из chessjax.js (${src.length} байт).`);
