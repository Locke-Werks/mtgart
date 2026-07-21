# MTGArt

Point it at a list of card names. Get back a stack of gorgeous, print-ready
cards that look like they fell out of a booster pack from a slightly cooler
parallel universe. It is a small factory that converts the sentence "I wish
Lightning Bolt looked like a Rembrandt" into an actual 300 DPI Rembrandt of
Lightning Bolt.

## What it actually does

1. You paste some card names.
2. It asks Scryfall what those cards really are, because it refuses to make
   things up (unlike the intern it replaced).
3. An AI art director reads each card's rules and writes a scene so overwrought
   it would make a fantasy novelist blush.
4. gpt-image-2 paints the entire card in one locked style you define, so a
   sixty-card set looks like one artist made it over a single, very caffeinated
   weekend.
5. sharp slices the result into print-ready proxies at true card size, with
   bleed, at 300 DPI.
6. You click "Download all" and go feed a printer.

## Features that exist and, against all odds, work

- **One master style prompt** drives every card, so a set reads as one cohesive
  thing instead of a ransom note of clashing styles.
- **Mana costs are sent as structured XML.** This is the entire reason a
  two-generic pip is now one circle with a "2" inside it, and not, as it was
  during a dark period of this project's history, two confused "1" circles
  standing awkwardly next to each other.
- **The whole card is XML.** Titles, type lines, rules, loyalty abilities. The
  model reads it like a spec sheet and mostly stops improvising flavor text.
- **Print pipeline** emits screen, trim, and bleed PNGs plus a per-card PDF.
- **Full send mode:** a large red button for when it is payday and the concept
  of a spend cap feels like a personal insult. Fires cards in parallel up to
  your API limit and ignores the cap entirely. Use responsibly, or don't. It is
  your money and your printer.

## Running it

You will need:

- Node 18+ (it was built on 22 and is happier there).
- An OpenAI API key with image-generation access. Set `OPENAI_API_KEY`.
- A willingness to spend roughly nineteen cents per high-quality card, a number
  that climbs alarmingly once you start "just trying one more theme."

```
cp .env.local.example .env.local    # then add your key
npm install
npm run dev                          # http://localhost:3000
```

Generate a single card from the terminal, for science:

```
npm run generate:one -- "Lightning Bolt" dark-oil
```

## The obligatory legal noises

This is a personal art tool. It is not affiliated with, endorsed by, or
otherwise on speaking terms with Wizards of the Coast. Magic: The Gathering,
the card names, the mana symbols, and the card frame are their intellectual
property. This README is not legal advice, a business plan, or a dare. Generate
for yourself, print for yourself, and do not come crying to a markdown file when
someone with a legal department sends you a very polite letter.

## License

Proprietary. All rights reserved. See `LICENSE`. No, you may not have the code.
No, not even that one nice little zip function. It is closed like a booster pack
you already know is all commons.
