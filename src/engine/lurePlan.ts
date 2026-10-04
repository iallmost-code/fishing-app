import type { WeatherSnapshot } from "../services/weather";
import type { ScoredHour } from "./forecast";
import type { LureRecommendation } from "./lureRecommendations";
import { getFishingWindows } from "./fishingWindows";
import { dateKey } from "../utils/format";

/** Water the plan is for; changes where to throw, not what. */
export type PlanWater = "lake" | "pond" | "river";
export type Period =
  | "Before dawn"
  | "Early morning"
  | "Morning"
  | "Midday"
  | "Afternoon"
  | "Evening"
  | "Night";
export type LurePlanStop = LureRecommendation & {
  /** One stretch ("Evening") or several merged ones ("Early morning – Afternoon"). */
  period: string;
  /** First hour of the stretch and one hour past its last. */
  start: string;
  end: string;
  /** Overlaps the day's best bite window. */
  prime: boolean;
  score: number;
};
export type Conditions = {
  light: "low" | "bright" | "dark";
  windMph: number | null;
  cloudCover: number | null;
  rainChance: number | null;
  pressure: string;
  temperature: number | null;
  month: number; // 1–12
  water?: PlanWater;
};

const HOUR = 3600000;
const avg = (values: (number | null)[]) => {
  const v = values.filter((x): x is number => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
function localHour(time: string, timezone: string) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date(time)),
  );
}
function monthOf(time: string, timezone: string) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      month: "numeric",
    }).format(new Date(time)),
  );
}

export function periodFor(
  time: string,
  timezone: string,
  sunrise?: string,
  sunset?: string,
): Period {
  const t = Date.parse(time),
    rise = sunrise ? Date.parse(sunrise) : NaN,
    set = sunset ? Date.parse(sunset) : NaN,
    h = localHour(time, timezone);
  if (Number.isFinite(rise) && Number.isFinite(set)) {
    if (t < rise - HOUR) return "Before dawn";
    if (t >= set + HOUR) return "Night";
    if (t < rise + 2 * HOUR) return "Early morning";
    if (t >= set - 2 * HOUR) return "Evening";
  } else if (h < 5) return "Before dawn";
  else if (h >= 21) return "Night";
  if (h < 11) return "Morning";
  if (h < 15) return "Midday";
  return "Afternoon";
}

/** Where to fish, adjusted for the kind of water. */
function where(base: string, water?: PlanWater) {
  if (water === "river")
    return `${base}. In current, fish eddies, seams and the slack water behind rocks and logs`;
  if (water === "pond")
    return `${base}. On a pond, walk the bank and hit outflow pipes, weed lines and the dam`;
  return base;
}
function seasonTip(month: number) {
  if (month >= 9 && month <= 11)
    return " Fall: bass chase shad, so follow the bait into creek arms and coves.";
  if (month >= 3 && month <= 5)
    return " Spring: check shallow pockets and flats where bass spawn.";
  if (month >= 6 && month <= 8)
    return " Summer: shallow early and late, deeper and shaded in the heat of the day.";
  return " Winter: slow down and fish deeper, steeper banks.";
}

/** One bait for one set of conditions: what, how, and where. */
export function pickLure(c: Conditions): LureRecommendation {
  const wind = c.windMph ?? 0,
    cloudy = (c.cloudCover ?? 0) >= 70,
    fall = c.month >= 9 && c.month <= 11,
    shad = fall ? "Shad / white" : "Natural shad";
  if (c.light === "dark") {
    const warm = (c.temperature ?? 0) >= 65 && wind < 8;
    return warm
      ? {
          name: "Buzzbait",
          color: "Black",
          retrieve: "Slow and steady so it gurgles across the top",
          target: where(
            "Shallow banks, lighted docks and points near deep water",
            c.water,
          ),
          reason:
            "At night bass feed shallow by sound and silhouette; black shows best against the sky.",
        }
      : {
          name: "Texas Rig",
          color: "Black / blue",
          retrieve: "Slow drag with long pauses",
          target: where(
            "Lighted docks, riprap and shallow cover next to deep water",
            c.water,
          ),
          reason:
            "Dark colors give a strong silhouette at night, and a slow bait is easy to find.",
        };
  }
  if ((c.rainChance ?? 0) >= 60)
    return {
      name: "Spinnerbait",
      color: "White / chartreuse",
      retrieve: "Slow roll just under the surface",
      target: where("Creek mouths, runoff and muddy inflows", c.water),
      reason:
        "Rain stains the water and washes in food; flash and thump help bass find the bait.",
    };
  // Overcast helps at dawn and dusk but is not a reason to throw topwater all day.
  if (
    (c.light === "low" || (cloudy && c.light !== "bright")) &&
    wind < 10 &&
    (c.temperature ?? 60) >= 55
  )
    return {
      name: "Topwater",
      color: cloudy ? "Bone" : shad,
      retrieve: "Walk the dog; pause near cover",
      target: where(
        fall
          ? "Shallow points, flats and the backs of creeks where shad gather"
          : "Shallow points, flats and grass edges",
        c.water,
      ),
      reason: `Low light pulls bass shallow to feed and makes them look up.${seasonTip(c.month)}`,
    };
  if (wind >= 8)
    return {
      name: "Chatterbait",
      color: cloudy ? "White / chartreuse" : shad,
      retrieve: "Steady medium retrieve, ticking cover",
      target: where("Wind-blown banks and points", c.water),
      reason: `Wind pushes bait onto these banks and breaks up the surface so bass hunt.${seasonTip(c.month)}`,
    };
  if (c.pressure.includes("Falling"))
    return {
      name: "Squarebill Crankbait",
      color: fall ? "Shad" : "Chartreuse / blue back",
      retrieve: "Medium speed, bounce it off wood and rock",
      target: where("Shallow wood, rock and riprap in 2–6 ft", c.water),
      reason: `Falling pressure often turns bass on; cover lots of water with a moving bait.${seasonTip(c.month)}`,
    };
  if (c.pressure.includes("Rising") || (c.temperature ?? 60) < 50)
    return {
      name: "Ned Rig",
      color: "Green pumpkin",
      retrieve: "Drag and shake slowly on the bottom",
      target: where("Tight to cover in 6–12 ft", c.water),
      reason: `Rising pressure or cold water slows bass down, so slow your bait down too.${seasonTip(c.month)}`,
    };
  if (c.light === "bright" && !cloudy)
    return {
      name: "Texas Rig",
      color: "Green pumpkin",
      retrieve: "Pitch to cover, let it fall, slow drag",
      target: where(
        "Shade: docks, overhanging trees and brush piles in 8–15 ft",
        c.water,
      ),
      reason: `Bright sun pushes bass into shade and deeper water.${seasonTip(c.month)}`,
    };
  return {
    name: "Swimbait",
    color: shad,
    retrieve: "Slow to medium steady retrieve",
    target: where("Points, edges and anywhere you see bait", c.water),
    reason: cloudy
      ? `Overcast keeps bass roaming, so cover water with a moving baitfish look.${seasonTip(c.month)}`
      : `A natural baitfish look that works in most conditions.${seasonTip(c.month)}`,
  };
}

/**
 * Split the rest of today into stretches (morning, midday, evening…) and
 * pick a bait and spot for each from that stretch's forecast.
 */
export function lurePlan(
  weather: WeatherSnapshot,
  hours: ScoredHour[],
  water?: PlanWater,
): LurePlanStop[] {
  const tz = weather.timezone,
    today = dateKey(weather.current.time, tz),
    nowHour = Math.floor(Date.parse(weather.current.time) / HOUR) * HOUR,
    day = weather.daily.find((d) => d.date === today),
    sunrise = day?.sunrise ?? weather.sunrise,
    sunset = day?.sunset ?? weather.sunset,
    month = monthOf(weather.current.time, tz);
  const left = hours.filter(
    (h) => dateKey(h.time, tz) === today && Date.parse(h.time) >= nowHour,
  );
  const best = getFishingWindows(
    left.filter((h) => Date.parse(h.time) >= Date.parse(weather.current.time)),
  )[0];
  const groups: { period: Period; hours: ScoredHour[] }[] = [];
  for (const h of left) {
    const period = periodFor(h.time, tz, sunrise, sunset),
      last = groups.at(-1);
    if (last && last.period === period) last.hours.push(h);
    else groups.push({ period, hours: [h] });
  }
  const stops = groups.map(({ period, hours: g }) => {
    const mid = g[Math.floor(g.length / 2)],
      start = g[0].time,
      end = new Date(Date.parse(g.at(-1)!.time) + HOUR).toISOString();
    const lure = pickLure({
      light:
        period === "Night" || period === "Before dawn"
          ? "dark"
          : period === "Early morning" || period === "Evening"
            ? "low"
            : "bright",
      windMph: avg(g.map((h) => h.windMph)),
      cloudCover: avg(g.map((h) => h.cloudCover)),
      rainChance: Math.max(-1, ...g.map((h) => h.precipitationChance ?? -1)),
      pressure: mid.result.pressure.label,
      temperature: avg(g.map((h) => h.temperature)),
      month,
      water,
    });
    return {
      ...lure,
      period,
      start,
      end,
      score: Math.round(avg(g.map((h) => h.score)) ?? 0),
      prime:
        !!best &&
        Date.parse(best.start) < Date.parse(end) &&
        Date.parse(best.end) > Date.parse(start),
    };
  });
  return mergeSameBait(stops);
}

/** Back-to-back stretches that want the same bait in the same spot become one stop. */
export function mergeSameBait(stops: LurePlanStop[]): LurePlanStop[] {
  const merged: LurePlanStop[] = [];
  for (const stop of stops) {
    const last = merged.at(-1);
    if (
      last &&
      last.name === stop.name &&
      last.color === stop.color &&
      last.retrieve === stop.retrieve &&
      last.target === stop.target
    ) {
      const first = last.period.split(" – ")[0];
      merged[merged.length - 1] = {
        ...last,
        period: first === stop.period ? first : `${first} – ${stop.period}`,
        end: stop.end,
        prime: last.prime || stop.prime,
        // Weighted by length so a long quiet stretch isn't dominated by a short one.
        score: Math.round(
          (last.score * (Date.parse(last.end) - Date.parse(last.start)) +
            stop.score * (Date.parse(stop.end) - Date.parse(stop.start))) /
            (Date.parse(stop.end) - Date.parse(last.start)),
        ),
      };
    } else merged.push(stop);
  }
  return merged;
}
