/* Norske data for EQ-5D-5L. Ingen pasientdata her. */

/* Norsk verdisett (Garratt, Stavem, Shaw & Rand 2024, Qual Life Res, Table 2: hybridmodell med 8 parametere,
   uten konstantledd, som ble valgt). 1 − indeks = Σ β_dimensjon × vekt_nivå.
   Nivåvekt: nivå 1 = 0, nivå 2 = L2, nivå 3 = L3, nivå 4 = L4, nivå 5 = 1. Laveste mulige indeks (55555) = −0,453. */
export const EQ5D_NO_BETA = { MO: 0.205, SC: 0.206, UA: 0.179, PD: 0.391, AD: 0.472 };
export const EQ5D_NO_LEVEL = [0, 0.152, 0.317, 0.775, 1];

/* Norske befolkningsnormer for EQ VAS, gjennomsnitt og SD (Garratt, Hansen, Augestad, Rand & Stavem 2022,
   Qual Life Res, Table 6, vektet). [fra alder, til alder, alle, kvinner, menn], hver [snitt, SD]. */
export const EQ_VAS_NORM = [
  [18, 29, [78.9, 16.1], [79.4, 15.7], [78.4, 16.4]],
  [30, 39, [80.8, 15.8], [78.7, 16.6], [82.9, 14.6]],
  [40, 49, [75.0, 20.5], [74.8, 20.3], [75.2, 20.7]],
  [50, 59, [78.3, 17.9], [79.5, 15.4], [77.0, 20.0]],
  [60, 69, [80.2, 17.7], [79.7, 18.1], [80.7, 17.4]],
  [70, 79, [78.0, 18.1], [77.6, 18.4], [78.4, 17.8]],
  [80, 200, [67.8, 23.9], [68.6, 22.4], [67.3, 24.9]]
];
