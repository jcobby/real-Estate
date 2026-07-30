import { webkit } from "@playwright/test";
const b = await webkit.launch(); const p = await b.newPage();
const errs=[]; p.on("pageerror",e=>errs.push(e.message.split("\n")[0]));
for (const path of ["/land-check","/map","/listings"]) {
  await p.goto("http://localhost:3000"+path,{waitUntil:"domcontentloaded",timeout:60000}).catch(()=>{});
  await p.waitForTimeout(6000);
  const canvas = await p.locator("canvas").count();
  const cw = canvas ? await p.locator("canvas").first().evaluate(el => el.clientWidth+"x"+el.clientHeight) : "-";
  console.log(`WebKit ${path}: canvas=${canvas} size=${cw}`);
}
console.log("errors:", errs.length?[...new Set(errs)].slice(0,4).join(" | "):"(none)");
await b.close();
