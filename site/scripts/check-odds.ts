import { formatAmerican, summarizePicks, averageAmericanOdds, averageDecimalOdds } from "./../src/lib/odds";
import { SEED_PICKS, assertSeedIntegrity } from "./../src/lib/data/seed";
assertSeedIntegrity();
const s = summarizePicks(SEED_PICKS);
console.log(JSON.stringify({
  picks: s.picks, record: `${s.wins}-${s.losses}-${s.pushes}`,
  winRate: +(s.winRate*100).toFixed(2), unitsNet: +s.unitsNet.toFixed(2),
  roi: +(s.roi*100).toFixed(2), unitsRisked: s.unitsRisked,
  avgDecimalOdds: +s.avgDecimalOdds.toFixed(4),
  avgAmerican: s.avgAmericanOdds, rendered: formatAmerican(s.avgAmericanOdds),
  naiveMean: +(SEED_PICKS.reduce((a,p)=>a+p.odds,0)/SEED_PICKS.length).toFixed(2),
  breakevenWinRate: +(s.breakevenWinRate*100).toFixed(2),
  tileValue: `${(s.breakevenWinRate*100).toFixed(1)}%`,
  tileSub: "stake-weighted mean of implied probabilities",
}, null, 2));
const probes = [[-110,110],[-100,100],[-105,100],[-101,100],[-110,105],[-110,-110,112],[100,100],[100,105,-105],[999,1000],[-100,-100,100]];
for (const p of probes) console.log(p.join(","), "->", averageAmericanOdds(p), formatAmerican(averageAmericanOdds(p)), "dec", averageDecimalOdds(p).toFixed(4));
