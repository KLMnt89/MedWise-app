import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Circle as SvgCircle, Stop } from 'react-native-svg';
import { colors, fonts, gradients, radii, type } from '../theme';

const SOFT = {
  medicine: colors.medicineSoft,
  blood: colors.bloodSoft,
  water: colors.waterSoft,
  assistant: colors.assistantSoft,
};
const DARK = {
  medicine: colors.medicineDark,
  blood: colors.bloodDark,
  water: colors.waterDark,
  assistant: colors.assistantDark,
};

export default function HealthGraph({ score = 0, nodes, size = 300 }) {
  const [activeKey, setActiveKey] = useState(nodes[0]?.key ?? null);
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.33;
  const coreR = size * 0.135;
  const nodeR = size * 0.105;

  const positions = nodes.map((node, index) => {
    const angle = (Math.PI / 2) * index + Math.PI / 4;
    return {
      ...node,
      x: cx + R * Math.cos(angle),
      y: cy + R * Math.sin(angle),
    };
  });

  const active = positions.find((p) => p.key === activeKey);

  return (
    <View>
      <View style={{ width: size, height: size, alignSelf: 'center' }}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradients.brand[0]} />
              <Stop offset="100%" stopColor={gradients.brand[1]} />
            </LinearGradient>
          </Defs>
          {positions.map((node) => (
            <Line
              key={`line-${node.key}`}
              x1={cx}
              y1={cy}
              x2={node.x}
              y2={node.y}
              stroke={node.key === activeKey ? DARK[node.tone] : colors.border}
              strokeWidth={node.key === activeKey ? 2.5 : 1.5}
            />
          ))}
          <SvgCircle cx={cx} cy={cy} r={coreR} fill="url(#coreGrad)" />
        </Svg>

        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View
            style={[
              styles.coreLabel,
              { left: cx - coreR, top: cy - coreR, width: coreR * 2, height: coreR * 2, borderRadius: coreR },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.coreScore}>{score}</Text>
            <Text style={styles.coreCaption}>Health Core</Text>
          </View>

          {positions.map((node) => {
            const isActive = node.key === activeKey;
            return (
              <Pressable
                key={node.key}
                onPress={() => setActiveKey(node.key)}
                style={[
                  styles.node,
                  {
                    left: node.x - nodeR,
                    top: node.y - nodeR,
                    width: nodeR * 2,
                    height: nodeR * 2,
                    borderRadius: nodeR,
                    backgroundColor: SOFT[node.tone],
                    borderWidth: isActive ? 2 : 0,
                    borderColor: DARK[node.tone],
                  },
                ]}
              >
                <Text style={{ fontSize: nodeR * 0.85 }}>{node.emoji}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {active ? (
        <View style={[styles.panel, { backgroundColor: SOFT[active.tone] }]}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelEmoji}>{active.emoji}</Text>
            <Text style={[styles.panelTitle, { color: DARK[active.tone] }]}>{active.label}</Text>
          </View>
          <Text style={styles.panelBody}>{active.summary}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  coreLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreScore: {
    color: colors.textOnPrimary,
    fontFamily: fonts.extraBold,
    fontSize: 22,
  },
  coreCaption: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: fonts.semiBold,
    fontSize: 10,
  },
  node: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    marginTop: 18,
    borderRadius: radii.lg,
    padding: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  panelEmoji: {
    fontSize: 16,
  },
  panelTitle: {
    ...type.bodyMedium,
  },
  panelBody: {
    ...type.body,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
