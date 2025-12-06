import { cn } from './utils'

describe('cn utility', () => {
    test('joins simple class strings', () => {
        expect(cn('foo', 'bar')).toBe('foo bar')
    })

    test('handles conditional classes via clsx-style objects', () => {
        expect(cn({ 'a': true, 'b': false })).toBe('a')
    })

    test('merges tailwind classes (last wins for conflicting utilities)', () => {
        // twMerge will keep the last conflicting utility (p-4 over p-2)
        expect(cn('p-2', 'p-4')).toBe('p-4')
    })

    test('removes duplicate classes and preserves order where appropriate', () => {
        expect(cn('text-sm', 'text-sm', 'font-bold')).toBe('text-sm font-bold')
    })
})
