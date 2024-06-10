export interface NavigationItem {
  label?: string;
  href?: string;
  icon?: any;
  opened?: boolean;
  children?: NavigationItem[];
}
