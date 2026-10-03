import {
  Sun,
  CloudSun,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CircleHelp,
} from "lucide-react";
export default function WeatherIcon({
  code,
  size = 24,
}: {
  code: number | null;
  size?: number;
}) {
  const Icon =
    code === null
      ? CircleHelp
      : code === 0
        ? Sun
        : code <= 3
          ? CloudSun
          : code <= 48
            ? CloudFog
            : code <= 67
              ? CloudRain
              : code <= 77
                ? CloudSnow
                : code <= 82
                  ? CloudRain
                  : code <= 86
                    ? CloudSnow
                    : CloudLightning;
  return <Icon size={size} aria-hidden="true" />;
}
