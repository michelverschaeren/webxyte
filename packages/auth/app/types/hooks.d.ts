declare module "#app" {
  interface RuntimeNuxtHooks {
    /** Na het afmelden, vóór de redirect: ruim site-specifieke state op. */
    "auth:logout": () => void | Promise<void>;
  }
}

export {};
