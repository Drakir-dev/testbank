/* Testregister og samlet DIPS-tekst. Ingen DOM, så dette kan testes i Node. */
import CFS from "./modules/cfs.js";
import FOURAT from "./modules/4at.js";
import MINICOG from "./modules/minicog.js";
import MMSENR3 from "./modules/mmsenr3.js";
import MOCA from "./modules/moca.js";
import BERG from "./modules/berg.js";
import OLS from "./modules/ols.js";
import TUG from "./modules/tug.js";
import SPPB from "./modules/sppb.js";
import STS from "./modules/sts30.js";
import GAIT from "./modules/10mwt.js";
import MINIBEST from "./modules/minibest.js";
import W6 from "./modules/6mwt.js";
import NPRS from "./modules/nprs.js";
import PSFS from "./modules/psfs.js";
import PGIC from "./modules/pgic.js";
import KOOS from "./modules/koos.js";
import HOOS from "./modules/hoos.js";
import IKDC from "./modules/ikdc.js";
import ACLRSI from "./modules/aclrsi.js";
import TEGNER from "./modules/tegner.js";
import QDASH from "./modules/qdash.js";
import OSS from "./modules/oss.js";
import WORC from "./modules/worc.js";
import ODI from "./modules/odi.js";
import NDI from "./modules/ndi.js";
import OREBRO from "./modules/orebro.js";
import STARTBACK from "./modules/startback.js";
import EQ5D from "./modules/eq5d.js";

const planned = (id, name, category) => ({ id, name, category, status: "planlagt" });

/* Rekkefølgen her er bibliotekets rekkefølge, og styrer rekkefølgen i DIPS-teksten */
export const TESTS = [
  CFS,
  FOURAT, MINICOG, MMSENR3, MOCA,
  BERG, OLS, MINIBEST,
  TUG, SPPB, STS, GAIT, W6,
  KOOS, HOOS, IKDC, ACLRSI, TEGNER,
  QDASH, OSS, WORC,
  ODI, NDI, OREBRO, STARTBACK,
  NPRS, PSFS, EQ5D, PGIC
];
export const CATEGORIES = ["Skrøpelighet", "Kognisjon", "Balanse", "Funksjon og gange", "PROM kne/hofte", "PROM skulder/arm", "PROM rygg/nakke", "Generiske"];

export const byId = id => TESTS.find(t => t.id === id);

/* Valgte tester sortert i bibliotekets rekkefølge */
export const libraryOrder = selected => TESTS.map(t => t.id).filter(x => selected.includes(x));

/* Samlet DIPS-tekst: én blokk per utfylt test, skilt med tom linje */
export function dipsBlocks(selected, states, profile) {
  return selected.map(id => byId(id).toText(states[id], profile)).filter(Boolean);
}
export const dipsText = (selected, states, profile) => dipsBlocks(selected, states, profile).join("\n\n");

/* Appversjonen som vises i toppen. Skal være lik CACHE i sw.js (sjekkes i tests/sw.test.js). */
export const VERSION = "20";

/* Hvilke tester som bruker alder og kjønn fra profilen (til normverdier). Kortet minner om det som mangler.
   tests/registry.test.js sjekker at alle moduler som leser p.age eller p.sex, står her. */
export const PROFILE_NEEDS = {
  cfs: ["age"], ols: ["age", "sex"], minibest: ["age"], tug: ["age"], sts30: ["age", "sex"],
  eq5d: ["age", "sex"], mmsenr3: ["age"], moca: ["age"]
};

/* Profilfeltene en test trenger, men som ikke er fylt ut */
export const missingProfile = (id, p) => (PROFILE_NEEDS[id] || []).filter(k => !String(p[k] ?? "").trim());

/* Status for et testkort: tom (ingen resultat), delvis (resultat, men ingen DIPS-tekst ennå) eller ferdig */
export function testStatus(t, s, p) {
  const r = t.result(s, p);
  if (!r) return { status: "tom", r: null };
  return { status: t.toText(s, p) ? "ferdig" : "delvis", r };
}
