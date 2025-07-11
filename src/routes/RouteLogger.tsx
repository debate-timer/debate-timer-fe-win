import { useEffect } from 'react';

export default function RouteLogger() {
  useEffect(() => {
    const currentRoute = window.location.href;
    console.log(`# Current route = ${currentRoute}`);
  }, []);

  return <></>;
}
