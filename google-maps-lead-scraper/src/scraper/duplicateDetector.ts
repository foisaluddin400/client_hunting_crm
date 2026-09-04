import { normalizeBusinessKey } from '../utils/normalize';

export class DuplicateDetector {
  private seenKeys = new Set<string>();

  public getKey(
    url: string | null | undefined,
    name: string | null | undefined,
    address: string | null | undefined
  ): string {
    return normalizeBusinessKey(url, name, address);
  }

  public has(key: string): boolean {
    return this.seenKeys.has(key);
  }

  public add(key: string): void {
    this.seenKeys.add(key);
  }

  public hasLead(
    url: string | null | undefined,
    name: string | null | undefined,
    address: string | null | undefined
  ): boolean {
    return this.has(this.getKey(url, name, address));
  }

  public addLead(
    url: string | null | undefined,
    name: string | null | undefined,
    address: string | null | undefined
  ): string {
    const key = this.getKey(url, name, address);
    this.add(key);
    return key;
  }

  public size(): number {
    return this.seenKeys.size;
  }

  public clear(): void {
    this.seenKeys.clear();
  }
}
