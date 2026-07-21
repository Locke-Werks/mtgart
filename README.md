# MTGArt

Point it at a list of card names. Get back a stack of gorgeous, print-ready
cards that look like they fell out of a booster pack from a slightly cooler
parallel universe. It is a small factory that converts the sentence "I wish this
card looked like a Rembrandt" into an actual 300 DPI Rembrandt of that card.

It is also, as of this writing, a cautionary tale about intellectual property.
More on that below, once you have stopped admiring the art.

<p align="center">
  <img src="docs/pyrewing-drake.png" width="240" alt="Pyrewing Drake" />
  <img src="docs/glimmerveil-oracle.png" width="240" alt="Glimmerveil Oracle" />
  <img src="docs/aldreth-last-ember.png" width="240" alt="Aldreth, the Last Ember" />
</p>

<p align="center"><em>Three completely made-up cards, one locked style, generated start to finish by this tool. It is a rendering engine, not a photocopier, which is a distinction its lawyer would like you to appreciate.</em></p>

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
6. You click "Download all" and go feed a printer that is legally none of our
   business.

## Features that exist and, against all odds, work

- **One master style prompt** drives every card, so a set reads as one cohesive
  thing instead of a ransom note of clashing styles.
- **The whole card is sent as XML.** Titles, type lines, rules, loyalty
  abilities, and mana pips. The model reads it like a spec sheet, which is the
  entire reason a two-generic pip is now one circle with a "2" inside it, and
  not, as it was during a dark period of this project's history, two confused
  "1" circles standing awkwardly next to each other.
- **The text box holds up under pressure.** Feed it a planeswalker with four
  loyalty abilities and it lays them out in tidy rows instead of melting into
  soup.

<p align="center">
  <img src="docs/aldreth-last-ember.png" width="380" alt="Aldreth, the Last Ember, full card" />
</p>

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

## A serious word, delivered by the management

Everything above is a joke. This section is not, so read it with your grown-up
face on.

This software generates images that reproduce the card names, rules text, mana
symbols, and card frame of Magic: The Gathering, all of which are the
intellectual property of Wizards of the Coast. It is a personal art and
playtesting tool. It is not affiliated with, endorsed by, or on speaking terms
with Wizards of the Coast.

Wizards is well within its rights to protect that property, and it is not shy
about doing so. Free, non-commercial tools that did essentially what this one
does have received cease-and-desist letters and vanished overnight. **This
project may do exactly the same, at any moment, without warning.** Treat its
continued existence as a pleasant surprise, not a promise. If it is here today
and gone tomorrow, that is the expected weather, not a bug.

Accordingly:

- Use this for personal, non-commercial purposes only. Make cards for your
  kitchen table, your playgroup, and your own amusement.
- **It is highly not recommended to use this software to create any kind of
  money-generating business.** Selling generated cards, selling prints of them,
  or charging for access to a service that makes them is precisely the activity
  that draws legal attention. We mean this sincerely, as advice, not as
  decorative legal cover.
- This is not legal advice. If you are weighing anything commercial, talk to an
  actual intellectual-property attorney first, not after.

Govern yourself accordingly.

## License

Copyright 2026 Locke Werks. Licensed under the GNU General Public License v3.0.
See `LICENSE` for the full text. It went open source because the alternative
timeline involved a law firm, and this one only involves you reading a very long
text file you will absolutely not read.
