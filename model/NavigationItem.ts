export interface NavigationItem {
  label: string;
  href: string;
  active?: boolean;
  icon?: string;
  children?: NavigationItem[];
}
