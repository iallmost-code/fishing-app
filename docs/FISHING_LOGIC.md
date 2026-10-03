# Fishing logic

The existing weather service, fishing score engine, and lure engine remain the entry points. Home still displays current weather, pressure deltas, the next eight scores, sun times, three bass lure picks, and explanations. Screens and pressure/window modules extend that app; no replacement scaffold was used.

## Score

Scores are weather-based heuristics, not probabilities of catching fish. Tunable constants are in `src/engine/fishingScore.ts`. Preserve the existing 48-point current baseline and 46-point hourly baseline. Current and detailed hourly calculations now share explainable factors:

| Condition                                   | Points        |
| ------------------------------------------- | ------------- |
| Falling pressure                            | +14           |
| Rapidly falling pressure                    | +8            |
| Stable pressure                             | +6            |
| Rising pressure                             | +1            |
| Rapidly rising pressure                     | −5            |
| Wind 4–12 mph                               | +10           |
| Wind >20 mph                                | −10           |
| Wind >12–20 mph                             | +3            |
| Wind <4 mph                                 | +2            |
| Cloud cover 45–90%                          | +9            |
| Cloud cover >90%                            | +5            |
| Other cloud cover                           | +1            |
| Within 1 / 2 / 3 hours of sunrise or sunset | +12 / +8 / +4 |
| Current precipitation present               | +2            |
| Hourly rain chance 20–65% / >80%            | +5 / −3       |
| Air temperature 55–85°F                     | +3            |
| Air temperature <35°F or >95°F              | −6            |
| Air temperature changes >12°F in six hours  | −4            |

Clamp and round `baseline + sum(impacts)` to 0–100. All applied factors, including the previously unlisted precipitation impact, are returned with their point values. Air temperature is explicitly not a measurement of water temperature. Missing fields contribute no points and appear as unavailable. Water temperature and solunar information remain unavailable, not fabricated. The old numeric `hourlyFishingScore` API remains exported for compatibility; new UI uses the explained `calculateHourlyScore`.

## Pressure

Pressure remains sea-level hPa internally. UI pressure, changes, and rate use `hPa × 0.0295299830714` inHg.

For each 1/3/6-hour delta, match a real observation within 20 minutes of the target hour. Never silently choose a distant reading. Three-hour delta / 3 is the preferred rate; fall back to the one-hour delta. Thresholds preserve the original classifications: rate ≤−1.2 hPa/hr rapidly falling; ≤−0.25 falling; ≥1.2 rapidly rising; ≥0.25 rising; otherwise stable. Unknown rate is unavailable.

The graph requests and displays previous 12 hours and next 12 hours, adding the real current reading. Color each consecutive segment using its actual rate, dash forecast segments, mark now, and break lines across gaps longer than 1.1 hours. Report shortened history. Historic API values are model history, not claimed local station observations.

## Continuous windows

Use available chronological hourly scores. Require scores ≥ `max(70, highest_score − 10)` and at least two consecutive one-hour timestamps. Never bridge gaps or generate random minute-level precision. Window end is one hour after the last qualifying hour. Rank by average score, then peak, then earliest start; return up to two windows. Home considers the remaining hours today. Forecast day cards summarize the whole available day; the detailed Today window excludes hours that already began.

Daily score is the rounded average of available hourly scores for that local day. Open-Meteo daily high/low, maximum wind/rain probability, weather code, sunrise, and sunset are kept separate. Today may lack older hours outside the 12-hour historical request; the hourly screen states its coverage. Unix API timestamps become UTC ISO strings and are displayed/grouped using the response IANA timezone, including DST transitions.

## Lures

Keep the existing three-pick bass engine. Wind ≥6 mph supports chatterbait; cloud cover ≥50% or falling pressure selects a topwater option; swimbait is a broad forage option; measured wind <6 mph allows a slower Texas rig. Every pick retains color, retrieve, target, and reason. Missing wind does not pretend conditions are calm. Pressure is a contextual input, never a guarantee or a claim about light level.
