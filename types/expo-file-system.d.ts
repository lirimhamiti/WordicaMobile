declare module "expo-file-system" {
  export const cacheDirectory: string;

  export enum EncodingType {
    UTF8 = "utf8",
    Base64 = "base64"
  }

  export function writeAsStringAsync(
    fileUri: string,
    contents: string,
    options?: { encoding?: EncodingType }
  ): Promise<void>;
}
