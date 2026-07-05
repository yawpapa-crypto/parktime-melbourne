import { SPOTS, TYPE_HEX } from "@/data/parking";

interface MelbourneCBDMapProps {
  selectedId: number | null;
  onSelect: (id: number) => void;
  width?: number;
  height?: number;
}

export function MelbourneCBDMap({
  selectedId,
  onSelect,
  width = 390,
  height = 430,
}: MelbourneCBDMapProps) {
  const EW = [78, 148, 218, 288, 358];
  const NS = [12, 67, 122, 172, 222, 270, 315, 352];
  const scaleX = width / 390;
  const scaleY = height / 430;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      role="img"
      aria-label="Melbourne CBD parking map"
      className="block"
    >
      <rect width={width} height={height} fill="#E8ECF2" />
      {EW.slice(0, -1).map((y1, ri) =>
        NS.slice(0, -1).map((x1, ci) => {
          const y2 = EW[ri + 1];
          const x2 = NS[ci + 1];
          const isGarden = ci >= 6 && ri <= 2;
          return (
            <rect
              key={`b-${ri}-${ci}`}
              x={(x1 + 11) * scaleX}
              y={(y1 + 11) * scaleY}
              width={(x2 - x1 - 11) * scaleX}
              height={(y2 - y1 - 11) * scaleY}
              fill={isGarden ? "#C9DDB5" : "#D5D9E2"}
            />
          );
        }),
      )}
      <rect x="0" y={372 * scaleY} width={width} height={58 * scaleY} fill="#BACFE8" />
      <path
        d={`M0 ${375 * scaleY} Q${width * 0.15} ${370 * scaleY} ${width * 0.3} ${376 * scaleY} Q${width * 0.5} ${382 * scaleY} ${width * 0.65} ${374 * scaleY} Q${width * 0.85} ${366 * scaleY} ${width} ${372 * scaleY} L${width} ${382 * scaleY} Q${width * 0.85} ${378 * scaleY} ${width * 0.65} ${384 * scaleY} Q${width * 0.5} ${390 * scaleY} ${width * 0.3} ${384 * scaleY} Q${width * 0.15} ${378 * scaleY} 0 ${382 * scaleY}Z`}
        fill="#A8C4E0"
      />
      <text
        x={width * 0.44}
        y={403 * scaleY}
        fill="#6E9EC0"
        fontSize={11 * Math.min(scaleX, scaleY)}
        fontWeight="500"
        fontFamily="'DM Sans', sans-serif"
        opacity="0.8"
      >
        Yarra River
      </text>
      <rect x="0" y={388 * scaleY} width={width} height={height - 388 * scaleY} fill="#D2D8E5" />
      {EW.map((y) => (
        <rect key={`ew-${y}`} x="0" y={y * scaleY} width={width} height={11 * scaleY} fill="#FFFFFF" />
      ))}
      {NS.map((x) => (
        <rect key={`ns-${x}`} x={x * scaleX} y="0" width={11 * scaleX} height={height * 0.9} fill="#FFFFFF" />
      ))}
      <rect x={268 * scaleX} y="0" width={13 * scaleX} height={height * 0.9} fill="#FFFFFF" />
      <line
        x1={274 * scaleX}
        y1="0"
        x2={274 * scaleX}
        y2={height * 0.9}
        stroke="#E0E8F0"
        strokeWidth="1"
        strokeDasharray="8,6"
      />
      <rect x={122 * scaleX} y={218 * scaleY} width={148 * scaleX} height={11 * scaleY} fill="#E8E4DA" />
      {[
        { x: 80, y: 68, text: "La Trobe" },
        { x: 90, y: 138, text: "Lonsdale" },
        { x: 90, y: 208, text: "Bourke" },
        { x: 90, y: 278, text: "Collins" },
        { x: 90, y: 348, text: "Flinders" },
      ].map((l) => (
        <text
          key={l.text}
          x={l.x * scaleX}
          y={l.y * scaleY}
          fill="#9AA3B0"
          fontSize={7.5 * Math.min(scaleX, scaleY)}
          fontFamily="'DM Sans', sans-serif"
          fontWeight="500"
        >
          {l.text}
        </text>
      ))}
      <circle cx={220 * scaleX} cy={220 * scaleY} r={18 * Math.min(scaleX, scaleY)} fill="#3B82F6" opacity="0.12" />
      <circle cx={220 * scaleX} cy={220 * scaleY} r={11 * Math.min(scaleX, scaleY)} fill="#3B82F6" opacity="0.22" />
      <circle cx={220 * scaleX} cy={220 * scaleY} r={6 * Math.min(scaleX, scaleY)} fill="#3B82F6" />
      <circle cx={220 * scaleX} cy={220 * scaleY} r={3 * Math.min(scaleX, scaleY)} fill="white" />
      {SPOTS.map((spot) => {
        const sel = spot.id === selectedId;
        const hex = TYPE_HEX[spot.type];
        const cx = spot.mx * scaleX;
        const cy = spot.my * scaleY;
        const r = sel ? 11 : 8;
        return (
          <g
            key={spot.id}
            role="button"
            tabIndex={0}
            aria-label={`${spot.street}, ${spot.badge}`}
            onClick={() => onSelect(spot.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(spot.id);
              }
            }}
            className="cursor-pointer focus:outline-none"
          >
            {sel && (
              <circle cx={cx} cy={cy} r={r * 1.8} fill={hex} opacity="0.18" />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={r * Math.min(scaleX, scaleY)}
              fill={hex}
              stroke="white"
              strokeWidth={sel ? 2.5 : 1.8}
            />
            <text
              x={cx}
              y={cy + 3.5 * Math.min(scaleX, scaleY)}
              textAnchor="middle"
              fill="white"
              fontSize={6.5 * Math.min(scaleX, scaleY)}
              fontFamily="'DM Mono', monospace"
              fontWeight="600"
            >
              {spot.limit.length <= 5 ? spot.limit : spot.limit.slice(0, 4)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
