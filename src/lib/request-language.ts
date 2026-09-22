import { cookies } from "next/headers";
import { LANGUAGE_COOKIE, resolveLanguage } from "./language";
import { translateText, translateContent } from "./locale-copy";

export async function getRequestLanguage() {
  return resolveLanguage((await cookies()).get(LANGUAGE_COOKIE)?.value);
}

export async function getCopy() {
  const language = await getRequestLanguage();
  return (text: string) => translateText(text, language);
}

export async function localizeMetadata<T>(metadata: T): Promise<T> {
  return translateContent(metadata, await getRequestLanguage());
}
