type Entry<T> = {
    value: T;
    insertTime: number;
};

/**
 * A Set implementation with TTL (time-to-live) functionality.
 * @template T - The type of values stored in the TTLSet.
 */
export class TTLSet<T> extends Set<T> {
    /**
     * Map of entries in the set and their insert times.
     */
    private map: Map<T, Entry<T>> = new Map();

    /**
     * Creates a new TTLSet with a given TTL.
     * @param {number} ttl - The TTL in milliseconds.
     */
    constructor(private ttl: number) {
        super();
    }


    /**
     * Adds a value to the set with the current timestamp as its insert time.
     * @param {T} value - The value to add.
     * @returns {TTLSet<T>} The updated TTLSet.
     */
    public add(value: T): this {
        const entry = { value, insertTime: Date.now() };
        this.map.set(value, entry);
        super.add(value);
        return this;
    }

    /**
     * Deletes a value from the set and its corresponding entry from the entries map.
     * @param {T} value - The value to delete.
     * @returns {boolean} True if the value was deleted, false if it was not found in the set.
     */
    public delete(value: T): boolean {
        const deleted = super.delete(value);
        if (deleted) {
            this.map.delete(value);
        }
        return deleted;
    }

    /**
     * Clears the set and the entries map.
     */
    public clear(): void {
        this.map.clear();
        super.clear();
    }

    /**
     * Checks if a value is in the set and has not expired.
     * @param {T} value - The value to check.
     * @returns {boolean} True if the value is in the set and has not expired, false otherwise.
     */
    public has(value: T): boolean {
        const entry = this.map.get(value);
        if (!entry) {
            return false;
        }
        const elapsedTime = Date.now() - entry.insertTime;
        if (elapsedTime > this.ttl) {
            this.delete(value);
            return false;
        }
        return true;
    }

    /**
     * Gets the size of the set after removing expired entries.
     * @type {number}
     */
    public get size(): number {
        this.deleteExpiredEntries();
        return super.size;
    }

    /**
     * Calls a callback function for each value in the set after removing expired entries.
     * @param {(value: T, value2: T, set: Set<T>) => void} callbackfn - The function to call for each value.
     * @param {any} [thisArg] - The value of 'this' inside the callback function.
     */
    public forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any): void {
        this.deleteExpiredEntries();
        super.forEach(callbackfn, thisArg);
    }

    /**
     * Deletes all entries from the entries map that have expired.
     */
    private deleteExpiredEntries(): void {
        const now = Date.now();
        for (const [value, entry] of this.map.entries()) {
            const elapsedTime = now - entry.insertTime;
            if (elapsedTime > this.ttl) {
                this.delete(value);
            }
        }
    }
}
