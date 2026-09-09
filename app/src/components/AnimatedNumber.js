import { useEffect, useRef, useState } from 'react';
import { Animated, Text } from 'react-native';

export default function AnimatedNumber({ value = 0, duration = 700, style, suffix = '' }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const listener = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(anim, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(listener);
  }, [value]);

  return (
    <Animated.Text style={style}>
      {display}
      {suffix}
    </Animated.Text>
  );
}
