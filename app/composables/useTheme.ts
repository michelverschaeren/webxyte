export type Theme = "premium-red" | "ambachtelijk" | "charcoal";

const themes: { id: Theme; label: string; primary: string; accent: string }[] =
  [
    {
      id: "premium-red",
      label: "Premium Red",
      primary: "#8B1A1A",
      accent: "#C9A84C",
    },
    {
      id: "ambachtelijk",
      label: "Ambachtelijk",
      primary: "#C17F24",
      accent: "#3D1F0A",
    },
    {
      id: "charcoal",
      label: "Charcoal Modern",
      primary: "#C0392B",
      accent: "#E8C97A",
    },
  ];

export function useTheme() {
  const currentTheme = useState<Theme>("theme", () => "premium-red");

  function setTheme(theme: Theme) {
    currentTheme.value = theme;
    if (import.meta.client) {
      const attr = theme === "premium-red" ? "" : theme;
      document.documentElement.setAttribute("data-theme", attr);
    }
  }

  // Apply on mount (client-side only)
  if (import.meta.client) {
    const attr = currentTheme.value === "premium-red" ? "" : currentTheme.value;
    document.documentElement.setAttribute("data-theme", attr);
  }

  return { currentTheme, themes, setTheme };
}
