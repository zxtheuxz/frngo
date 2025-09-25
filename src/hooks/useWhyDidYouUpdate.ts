import { useEffect, useRef } from 'react';

export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  // Get a mutable ref object where we can store props for comparison next time this hook runs.
  const previousProps = useRef<Record<string, any>>();

  useEffect(() => {
    // Apenas em desenvolvimento
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    if (previousProps.current) {
      // Get all keys from previous and current props
      const allKeys = Object.keys({...previousProps.current, ...props});
      
      // Use this object to keep track of changed props
      const changedProps: Record<string, any> = {};
      
      // Iterate through keys
      allKeys.forEach(key => {
        // If previous is different from current
        if (previousProps.current![key] !== props[key]) {
          // Add to changedProps
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key]
          };
        }
      });

      // If changedProps after iteration has keys, then output them
      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    // Finally update previousProps with current props for next hook call
    previousProps.current = props;
  });
}