// Puzzle Tooling — client-side SQLite via sql.js (WASM) loaded from CDN
// https://sql.js.org

/* ------------------------------------------------------------------ */
//  Load sql.js dynamically from CDN so we don't need npm bundling     //
/* ------------------------------------------------------------------ */

function loadSqlJs(): Promise<any> {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/sql-wasm.min.js";
        script.onload = () => {
            // sql.js exposes initSqlJs on window when loaded from CDN
            (window as any).initSqlJs({
                locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/${file}`
            }).then(resolve).catch(reject);
        };
        script.onerror = () => reject(new Error("Failed to load sql.js"));
        document.head.appendChild(script);
    });
}

let db: any = null;

const DB_URL = "/puzzle-data.db";
const LIMIT = 200;

/* ------------------------------------------------------------------ */
/*  Database loader                                                    */
/* ------------------------------------------------------------------ */

async function loadDatabase(): Promise<void> {
    if (db) return; // already loaded

    const SQL = await loadSqlJs();

    const response = await fetch(DB_URL);
    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    db = new SQL.Database(uint8Array);
}

function query(sql: string, params?: any[]): any[] {
    if (!db) return [];
    const stmt = db.prepare(sql);
    if (params) stmt.bind(params);
    const results: any[] = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

/* ------------------------------------------------------------------ */
/*  Word Search                                                        */
/* ------------------------------------------------------------------ */

function wordSearch(queryStr: string, anagrams: boolean): void {
    const q = queryStr.toUpperCase();
    if (q.length === 0) {
        clearTextarea("foundWords");
        return;
    }

    let words: any[];
    if (anagrams) {
        words = anagramQuery(q);
    } else {
        words = query(
            "SELECT word FROM words WHERE word LIKE ? ORDER BY word LIMIT ?",
            [q, LIMIT]
        );
    }

    const list = words.map(r => r.word);
    showResults("foundWords", list, LIMIT);
}

function anagramQuery(queryStr: string): any[] {
    const lookup: Record<string, number> = {};
    for (const ch of queryStr) {
        if (!(ch in lookup)) lookup[ch] = 0;
        lookup[ch]++;
    }

    let sql = `SELECT word FROM words WHERE (LENGTH(word) = ${queryStr.length})`;
    const comparison = "_" in queryStr ? ">=" : "=";
    for (const key of Object.keys(lookup)) {
        const value = lookup[key];
        if (key !== "_") {
            sql += ` AND (LENGTH(word) - LENGTH(REPLACE(word, '${key}', '')) ${comparison} ${value})`;
        }
    }

    return query(sql + " LIMIT ?", [LIMIT]);
}

/* ------------------------------------------------------------------ */
/*  Crossword Search                                                   */
/* ------------------------------------------------------------------ */

function crosswordSearch(queryStr: string): void {
    const q = queryStr.toUpperCase();
    if (q.length === 0) {
        clearCrossword();
        return;
    }

    const questions = query(
        "SELECT clue || ' ⩥ ' || answer AS qa FROM crosswords WHERE clue LIKE ? ORDER BY clue LIMIT ?",
        [q, LIMIT]
    );
    const answers = query(
        "SELECT clue || ' ⩥ ' || answer AS qa FROM crosswords WHERE answer LIKE ? ORDER BY answer LIMIT ?",
        [q, LIMIT]
    );

    showCrossword("questions", questions.map(r => r.qa), LIMIT);
    showCrossword("answers", answers.map(r => r.qa), LIMIT);
}

/* ------------------------------------------------------------------ */
/*  Thesaurus / Homophones                                             */
/* ------------------------------------------------------------------ */

function extraWordSearch(queryStr: string, choice: string): void {
    const q = queryStr.toUpperCase();
    if (q.length === 0) {
        clearTextarea("foundExtraWords");
        return;
    }

    let results: any[];
    if (choice === "Thesaurus") {
        results = query(
            `SELECT T.word, L.synonymList
             FROM thesaurus T
             JOIN thesaurus_lookup L
             ON SUBSTR(T.synonymIds, 0, INSTR(T.synonymIds, ',')) = L.id
             WHERE word LIKE ? ORDER BY word LIMIT ?`,
            [q, LIMIT]
        );
        const list = results.map(r => `${r.word} -> ${r.synonymList}`);
        showResults("foundExtraWords", list, LIMIT);
    } else {
        results = query(
            "SELECT homophones FROM homophones WHERE UPPER(homophones) LIKE ? ORDER BY homophones LIMIT ?",
            [`${q}%`, LIMIT]
        );
        const list = results.map(r => r.homophones);
        showResults("foundExtraWords", list, LIMIT);
    }
}

/* ------------------------------------------------------------------ */
/*  Number Conversion (pure client-side)                               */
/* ------------------------------------------------------------------ */

function getById(id: string): string {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (!el) throw new Error(`Expected element #${id}. Developer bug.`);
    return el.value;
}

function isChecked(id: string): boolean {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (!el) throw new Error(`Expected element #${id}. Developer bug.`);
    return el.checked;
}

function convertNumbers(): void {
    let outputString = "";

    let baseStr = getById("inputBase");
    if (baseStr.length === 0) baseStr = "10";
    const base = parseInt(baseStr);

    let delimiter = getById("inputDelimiter");
    if (delimiter.length === 0) delimiter = " ";

    const parts = getById("numbersToConvert").split(delimiter);
    for (let j = 2; j <= 36; j++) {
        let convertedNumbers = `(${j}) `;
        if (j < 10) convertedNumbers += " ";

        for (let i = 0; i < parts.length; i++) {
            const number = parseInt(parts[i], base);
            convertedNumbers += number.toString(j) + delimiter;
        }

        outputString += convertedNumbers + "\r\n";
    }

    document.getElementById("convertedNumbers")!.textContent = outputString;
}

/* ------------------------------------------------------------------ */
/*  Substitution Codes (pure client-side)                              */
/* ------------------------------------------------------------------ */

function convertSubstituteNumbers(): void {
    const input = getById("numbersToConvertSubst");
    let delimiter = getById("inputDelimiterSubst");
    if (delimiter.length === 0) delimiter = " ";

    let rotateValue = getById("rotateAmount");
    if (rotateValue.length === 0) rotateValue = "13";

    let morseDot = getById("MorseDot");
    if (morseDot.length === 0) morseDot = ".";
    let morseDash = getById("MorseDash");
    if (morseDash.length === 0) morseDash = "-";

    const parts = input.split(delimiter);
    let outputString = "";

    if (isChecked("AZConvertSubst")) {
        outputString += letterToNumber(parts) + "\r\n";
    }

    if (isChecked("rotateSubst")) {
        (document.getElementById("rotateAmount") as HTMLInputElement).disabled = false;
        outputString += rotN(parts, rotateValue) + "\r\n";
    } else {
        (document.getElementById("rotateAmount") as HTMLInputElement).disabled = true;
    }

    if (isChecked("ASCIIConvertSubst")) {
        outputString += numberToAscii(parts) + "\r\n";
    }

    if (isChecked("MorseConvertSubst")) {
        (document.getElementById("MorseDot") as HTMLInputElement).disabled = false;
        (document.getElementById("MorseDash") as HTMLInputElement).disabled = false;
        outputString += convertMorse(parts, morseDot, morseDash) + "\r\n";
    } else {
        (document.getElementById("MorseDot") as HTMLInputElement).disabled = true;
        (document.getElementById("MorseDash") as HTMLInputElement).disabled = true;
    }

    document.getElementById("convertedNumbersSubst")!.textContent = outputString;
}

function letterToNumber(parts: string[]): string {
    let result = "";
    for (const part of parts) {
        const integer = (parseInt(part) - 1) % 26;
        if (isNaN(integer)) {
            result += part;
        } else {
            result += String.fromCharCode(65 + integer);
        }
        result += " ";
    }
    return result;
}

function rotN(parts: string[], rotateAmount: string): string {
    let result = "";
    for (const part of parts) {
        if (part.length === 1) {
            let charValue = part.toUpperCase().charCodeAt(0);
            charValue += parseInt(rotateAmount);
            if (charValue > "Z".charCodeAt(0)) {
                charValue -= 26;
            }
            result += String.fromCharCode(charValue);
        } else {
            result += part;
        }
        result += " ";
    }
    return result;
}

function numberToAscii(parts: string[]): string {
    let result = "";
    for (const part of parts) {
        const integer = parseInt(part);
        if (isNaN(integer)) {
            result += part;
        } else {
            result += String.fromCharCode(integer);
        }
        result += " ";
    }
    return result;
}

function convertMorse(parts: string[], dotChar: string, dashChar: string): string {
    let result = "";
    for (const part of parts) {
        result += parseMorseCharacter(part, dotChar, dashChar);
    }
    return result;
}

function escapeRegExp(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseMorseCharacter(character: string, dotChar: string, dashChar: string): string {
    const normalized = character
        .replace(new RegExp(escapeRegExp(dotChar), "g"), ".")
        .replace(new RegExp(escapeRegExp(dashChar), "g"), "-");

    switch (normalized) {
        case ".-": return "A";
        case "-...": return "B";
        case "-.-.": return "C";
        case "-..": return "D";
        case ".": return "E";
        case "..-.": return "F";
        case "--.": return "G";
        case "....": return "H";
        case "..": return "I";
        case ".---": return "J";
        case "-.-": return "K";
        case ".-..": return "L";
        case "--": return "M";
        case "-.": return "N";
        case "---": return "O";
        case ".--.": return "P";
        case "--.-": return "Q";
        case ".-.": return "R";
        case "...": return "S";
        case "-": return "T";
        case "..-": return "U";
        case "...-": return "V";
        case ".--": return "W";
        case "-..-": return "X";
        case "-.--": return "Y";
        case "--..": return "Z";
        case ".----": return "1";
        case "..---": return "2";
        case "...--": return "3";
        case "....-": return "4";
        case ".....": return "5";
        case "-....": return "6";
        case "--...": return "7";
        case "---..": return "8";
        case "----.": return "9";
        case "-----": return "0";
        default: return "?";
    }
}

/* ------------------------------------------------------------------ */
/*  UI helpers                                                         */
/* ------------------------------------------------------------------ */

function showResults(containerId: string, items: string[], limit: number): void {
    const container = document.getElementById(containerId)!;
    const limited = items.length === limit ? " (Limited!)" : "";
    container.innerHTML = `<textarea readonly>${items.join("\n")}</textarea><small>${items.length}${limited}</small>`;
}

function showCrossword(id: string, items: string[], limit: number): void {
    const fieldset = document.getElementById("foundCrossword")!;
    // We render into the specific textarea by finding it via label
    const limited = items.length === limit ? " (Limited!)" : "";

    if (id === "questions") {
        const textareas = fieldset.querySelectorAll("textarea");
        if (textareas[0]) {
            textareas[0].textContent = items.join("\n");
            // Update or add count label
            let small = textareas[0].nextElementSibling;
            if (!small || small.tagName !== "SMALL") {
                small = document.createElement("small");
                textareas[0].after(small);
            }
            small.textContent = `${items.length}${limited}`;
        }
    } else {
        const textareas = fieldset.querySelectorAll("textarea");
        if (textareas[1]) {
            textareas[1].textContent = items.join("\n");
            let small = textareas[1].nextElementSibling;
            if (!small || small.tagName !== "SMALL") {
                small = document.createElement("small");
                textareas[1].after(small);
            }
            small.textContent = `${items.length}${limited}`;
        }
    }
}

function clearTextarea(containerId: string): void {
    const container = document.getElementById(containerId)!;
    container.innerHTML = "<textarea readonly></textarea>";
}

function clearCrossword(): void {
    const fieldset = document.getElementById("foundCrossword")!;
    const textareas = fieldset.querySelectorAll("textarea");
    textareas.forEach(ta => ta.textContent = "");
    const smalls = fieldset.querySelectorAll("small");
    smalls.forEach(s => s.remove());
}

/* ------------------------------------------------------------------ */
/*  Event wiring — lazy-load DB on first interaction                   */
/* ------------------------------------------------------------------ */

let dbReady: Promise<void> | null = null;

async function ensureDb(): Promise<void> {
    if (!dbReady) {
        dbReady = loadDatabase();
    }
    await dbReady;
}

// Debounce helper
function debounce(fn: () => void, ms: number): () => void {
    let timer: ReturnType<typeof setTimeout>;
    return () => {
        clearTimeout(timer);
        timer = setTimeout(fn, ms);
    };
}

window.addEventListener("DOMContentLoaded", async () => {
    // Word Search
    const wordInput = document.getElementById("wordSearchQuery") as HTMLInputElement;
    const anagramCb = document.getElementById("anagramCheckbox") as HTMLInputElement;
    const onWordChange = debounce(async () => {
        await ensureDb();
        wordSearch(wordInput.value, anagramCb.checked);
    }, 125);
    wordInput.addEventListener("input", onWordChange);
    anagramCb.addEventListener("change", onWordChange);

    // Crossword Search
    const cwInput = document.getElementById("crosswordQuery") as HTMLInputElement;
    const onCwChange = debounce(async () => {
        await ensureDb();
        crosswordSearch(cwInput.value);
    }, 125);
    cwInput.addEventListener("input", onCwChange);

    // Thesaurus / Homophones
    const extraInput = document.getElementById("wordExtraQuery") as HTMLInputElement;
    const thesRadio = document.getElementById("thesaurusRadio") as HTMLInputElement;
    const homoRadio = document.getElementById("homophonesRadio") as HTMLInputElement;
    const onExtraChange = debounce(async () => {
        await ensureDb();
        const choice = thesRadio.checked ? "Thesaurus" : "Homophones";
        extraWordSearch(extraInput.value, choice);
    }, 125);
    extraInput.addEventListener("input", onExtraChange);
    thesRadio.addEventListener("change", onExtraChange);
    homoRadio.addEventListener("change", onExtraChange);

    // Number Conversion (no DB needed)
    const numInput = document.getElementById("numbersToConvert") as HTMLInputElement;
    const baseInput = document.getElementById("inputBase") as HTMLInputElement;
    const delimInput = document.getElementById("inputDelimiter") as HTMLInputElement;
    numInput.addEventListener("input", convertNumbers);
    baseInput.addEventListener("input", convertNumbers);
    delimInput.addEventListener("input", convertNumbers);

    // Substitution Codes (no DB needed)
    const substInput = document.getElementById("numbersToConvertSubst") as HTMLInputElement;
    const substDelim = document.getElementById("inputDelimiterSubst") as HTMLInputElement;
    const azCb = document.getElementById("AZConvertSubst") as HTMLInputElement;
    const rotCb = document.getElementById("rotateSubst") as HTMLInputElement;
    const rotAmt = document.getElementById("rotateAmount") as HTMLInputElement;
    const asciiCb = document.getElementById("ASCIIConvertSubst") as HTMLInputElement;
    const morseCb = document.getElementById("MorseConvertSubst") as HTMLInputElement;
    const morseDotInput = document.getElementById("MorseDot") as HTMLInputElement;
    const morseDashInput = document.getElementById("MorseDash") as HTMLInputElement;

    substInput.addEventListener("input", convertSubstituteNumbers);
    [substDelim, azCb, rotCb, rotAmt, asciiCb, morseCb, morseDotInput, morseDashInput].forEach(el => {
        el!.addEventListener("change", convertSubstituteNumbers);
    });
});
