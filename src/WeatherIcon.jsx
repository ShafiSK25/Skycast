
const SUN = "#f6b73c";
const CLOUD = "#bccadf";
const CLOUD_DARK = "#8d9bbd";
const RAIN = "#4f86f7";

function Sun({ cx = 28, cy = 28, r = 9 }) {
  return (
    <g>
      <g stroke={SUN} strokeWidth="3" strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line
            key={a}
            x1={cx}
            y1={cy - r - 4}
            x2={cx}
            y2={cy - r - 8}
            transform={`rotate(${a} ${cx} ${cy})`}
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={r} fill={SUN} />
    </g>
  );
}

function Moon() {
  return (
    <g>
      <mask id="moon-cut">
        <rect width="56" height="56" fill="#fff" />
        <circle cx="35" cy="21" r="12" fill="#000" />
      </mask>
      <circle cx="26" cy="27" r="15" fill="#f3e7a6" mask="url(#moon-cut)" />
    </g>
  );
}

function Cloud({ fill = CLOUD, x = 0, y = 0 }) {
  return (
    <g fill={fill} transform={`translate(${x} ${y})`}>
      <circle cx="20" cy="32" r="8" />
      <circle cx="30" cy="26" r="10" />
      <circle cx="40" cy="33" r="7" />
      <rect x="20" y="32" width="20" height="8" />
    </g>
  );
}

function Lines({ ys, color }) {
  return (
    <g stroke={color} strokeWidth="3" strokeLinecap="round">
      {ys.map((y, i) => (
        <line
          key={y}
          x1={14 + (i % 2) * 4}
          y1={y}
          x2={42 - (i % 2) * 4}
          y2={y}
        />
      ))}
    </g>
  );
}

export function WeatherIcon({ code = "01d", size = 48 }) {
  const type = code.slice(0, 2);
  const night = code.endsWith("n");
  let body;

  switch (type) {
    case "01": // clear
      body = night ? <Moon /> : <Sun />;
      break;
    case "02": // few clouds
      body = (
        <>
          {night ? <Moon /> : <Sun cx={22} cy={22} r={8} />}
          <Cloud y={4} />
        </>
      );
      break;
    case "03": // scattered clouds
      body = <Cloud />;
      break;
    case "04": // broken / overcast
      body = (
        <>
          <Cloud fill={CLOUD_DARK} x={6} y={-6} />
          <Cloud />
        </>
      );
      break;
    case "09": // drizzle / shower rain
    case "10": // rain
      body = (
        <>
          <Cloud fill={CLOUD_DARK} y={-5} />
          <g stroke={RAIN} strokeWidth="3" strokeLinecap="round">
            <line x1="22" y1="39" x2="19" y2="47" />
            <line x1="30" y1="39" x2="27" y2="47" />
            <line x1="38" y1="39" x2="35" y2="47" />
          </g>
        </>
      );
      break;
    case "11": // thunderstorm
      body = (
        <>
          <Cloud fill="#6b6f94" y={-5} />
          <polygon points="31,33 24,45 30,45 27,54 38,40 32,40" fill={SUN} />
        </>
      );
      break;
    case "13": // snow
      body = (
        <>
          <Cloud y={-5} />
          <g fill="#fff" stroke="#9fb0d0" strokeWidth="1">
            <circle cx="22" cy="44" r="2.6" />
            <circle cx="30" cy="48" r="2.6" />
            <circle cx="38" cy="44" r="2.6" />
          </g>
        </>
      );
      break;
    case "50": // mist, haze, fog
      body = (
        <>
          <Cloud y={-8} />
          <Lines ys={[38, 44, 50]} color={CLOUD_DARK} />
        </>
      );
      break;
    default:
      body = <Cloud />;
  }

  return (
    <svg viewBox="0 0 56 56" width={size} height={size} aria-hidden="true">
      {body}
    </svg>
  );
}

export function DropIcon({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" fill={RAIN} />
    </svg>
  );
}

export function WindIcon({ size = 22 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="#7a6fd6"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3 9h10a3 3 0 1 0-3-3" />
      <path d="M3 15h14a3 3 0 1 1-3 3" />
      <path d="M3 12h7" />
    </svg>
  );
}

export function ArrowIcon({ down = false, size = 14 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={down ? { transform: "rotate(180deg)" } : undefined}
      aria-hidden="true"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
