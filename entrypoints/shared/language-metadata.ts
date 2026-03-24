export type LanguageDirection = "ltr" | "rtl";

export type LanguageOption = {
  code: string;
  name: string;
  direction: LanguageDirection;
};

export const LANGUAGE_OPTIONS = [
  { code: "vi", name: "Vietnamese", direction: "ltr" },
  { code: "en", name: "English", direction: "ltr" },
  { code: "fa", name: "Persian", direction: "rtl" },
  { code: "zh", name: "Chinese", direction: "ltr" },
  { code: "ja", name: "Japanese", direction: "ltr" },
  { code: "ko", name: "Korean", direction: "ltr" },
  { code: "es", name: "Spanish", direction: "ltr" },
  { code: "fr", name: "French", direction: "ltr" },
  { code: "de", name: "German", direction: "ltr" },
  { code: "pt", name: "Portuguese", direction: "ltr" },
  { code: "ru", name: "Russian", direction: "ltr" },
  { code: "ar", name: "Arabic", direction: "rtl" },
  { code: "hi", name: "Hindi", direction: "ltr" },
  { code: "it", name: "Italian", direction: "ltr" },
  { code: "th", name: "Thai", direction: "ltr" },
  { code: "id", name: "Indonesian", direction: "ltr" },
  { code: "nl", name: "Dutch", direction: "ltr" },
  { code: "pl", name: "Polish", direction: "ltr" },
  { code: "tr", name: "Turkish", direction: "ltr" },
] as const satisfies readonly LanguageOption[];

export const getLanguageByCode = (code: string): LanguageOption | undefined => {
  return LANGUAGE_OPTIONS.find((language) => language.code === code);
};

export const getLanguageName = (code: string): string => {
  return getLanguageByCode(code)?.name ?? code;
};

export const getLanguageDirection = (code: string): LanguageDirection => {
  return getLanguageByCode(code)?.direction ?? "ltr";
};
