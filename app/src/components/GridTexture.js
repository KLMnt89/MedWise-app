import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

export default function GridTexture({ width, height, spacing = 22, dotColor = 'rgba(255,255,255,0.16)', style }) {
  return (
    <Svg width={width} height={height} style={style} pointerEvents="none">
      <Defs>
        <Pattern id="dotGrid" width={spacing} height={spacing} patternUnits="userSpaceOnUse">
          <Circle cx={1.2} cy={1.2} r={1.2} fill={dotColor} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#dotGrid)" />
    </Svg>
  );
}
