import {
  useEffect,
  useRef,
  type EffectCallback,
  type DependencyList,
} from "react";

/**
 * Igual ao useEffect, mas ignora a primeira renderização (montagem inicial).
 */
export function useDidMountEffect(
  effect: EffectCallback,
  deps: DependencyList
) {
  const didMount = useRef(false);

  useEffect(() => {
    if (didMount.current) {
      return effect();
    } else {
      didMount.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
