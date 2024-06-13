export interface NavigationItem {
  label: string;
  href: string;
  active: boolean;
  icon?: any;
  children?: NavigationItem[];
}
