// To keep TS happy
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'vue-router' {
  export type RouteLocationRaw = any;
  export type RouteLocationNormalizedLoaded = any;

  export interface Router {
    push(to: RouteLocationRaw): Promise<void> | void;
  }

  export function useRouter(): Router;
  export function useRoute(): RouteLocationNormalizedLoaded;
}

declare module '*.css';
