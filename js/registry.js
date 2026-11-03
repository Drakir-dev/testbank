/* Testregister og samlet DIPS-tekst. Ingen DOM, så dette kan testes i Node. */
import CFS from "./modules/cfs.js";
import BERG from "./modules/berg.js";
import OLS from "./modules/ols.js";
import TUG from "./modules/tug.js";
import SPPB from "./modules/sppb.js";
import STS from "./modules/sts30.js";
import GAIT from "./modules/10mwt.js";
import NPRS from "./modules/nprs.js";
import PSFS from "./modules/psfs.js";
import PGIC from "./modules/pgic.js";
import KOOS from "./modules/koos.js";
import HOOS from "./modules/hoos.js";
import IKDC from "./modules/ikdc.js";

const planned = (id, name, category) => ({ id, name, category, status: "planlagt" });

/* Rekkefølgen her er bibliotekets rekkefølge, og styrer rekkefølgen i DIPS-teksten */
export const TESTS = [
  CFS,
  BERG, OLS, planned("minibest", "Mini-BESTest", "Balanse"),
  TUG, SPPB, STS, GAIT, planned("6mwt", "6-minutters gangtest", "Funksjon og gange"),
  KOOS, HOOS, IKDC, planned("aclrsi", "ACL-RSI", "PROM kne/hofte"), planned("tegner", "Tegner", "PROM kne/hofte"),
  planned("qdash", "QuickDASH", "PROM skulder/arm"), planned("oss", "Oxford Shoulder Score", "PROM skulder/arm"), planned("worc", "WORC/WOSI", "PROM skulder/arm"),
  planned("odi", "ODI", "PROM rygg/nakke"), planned("ndi", "NDI", "PROM rygg/nakke"), planned("orebro", "Örebro", "PROM rygg/nakke"), planned("startback", "STarT Back", "PROM rygg/nakke"),
  NPRS, PSFS, planned("eq5d", "EQ-5D", "Generiske"), PGIC
];
export const CATEGORIES = ["Skrøpelighet", "Balanse", "Funksjon og gange", "PROM kne/hofte", "PROM skulder/arm", "PROM rygg/nakke", "Generiske"];

export const byId = id => TESTS.find(t => t.id === id);

/* Valgte tester sortert i bibliotekets rekkefølge */
export const libraryOrder = selected => TESTS.map(t => t.id).filter(x => selected.includes(x));

/* Samlet DIPS-tekst: én blokk per utfylt test, skilt med tom linje */
export function dipsBlocks(selected, states, profile) {
  return selected.map(id => byId(id).toText(states[id], profile)).filter(Boolean);
}
export const dipsText = (selected, states, profile) => dipsBlocks(selected, states, profile).join("\n\n");
