export interface NavigationItem {
  label: string;
  href: string;
  active?: boolean;
  icon?: unknown;
  children?: NavigationItem[];
}
